export type MuxRpcOutputTypes = 'sync' | 'async' | 'source' | 'sink' | 'duplex';

export type MuxRpcPermissions = Record<string, 'allow' | 'deny'>;

export function muxrpc(type: MuxRpcOutputTypes, perms?: MuxRpcPermissions) {
  return function DecorateManifestMethod(target: any, methodName: string) {
    const statics = target.constructor;

    if (target[methodName] && typeof target[methodName] !== 'function') {
      throw new Error(
        'You can only use the @muxrpc decorator on methods, ' +
          'are you sure that is the case for `' +
          methodName +
          '`?',
      );
    }
    if (
      target[methodName] &&
      typeof target[methodName] === 'function' &&
      target[methodName].name === methodName
    ) {
      throw new Error(
        'You can only use the @muxrpc decorator on "this-bound" methods, ' +
          'are you sure that is the case for the `' +
          methodName +
          '` method in your class?\n' +
          '\nINCORRECT: `myMethod(x) {`' +
          '\n  CORRECT: `myMethod = (x) => {`' +
          '\n',
      );
    }

    // Augment the 'manifest' static field
    if (!statics.manifest) {
      statics.manifest = {};
    }
    statics.manifest[methodName] = type;

    // Augment the 'permissions' static field
    if (perms) {
      if (!statics.permissions) {
        statics.permissions = {};
      }
      for (let role of Object.keys(perms)) {
        const decision: 'allow' | 'deny' = perms[role];
        if (!statics.permissions[role]) {
          statics.permissions[role] = {};
        }
        if (!statics.permissions[role][decision]) {
          statics.permissions[role][decision] = [];
        }
        statics.permissions[role][decision].push(methodName);
      }
    }
  };
}

export function plugin(version: string) {
  return function DecorateSecretStackPlugin(constructor: any) {
    if (!version || typeof version !== 'string') {
      throw new Error(
        'The @plugin decorator expects one argument: a `version` string',
      );
    }

    // Set the 'version' static field
    constructor.version = version;

    // Set the 'init' static field
    constructor.init = function init(...args: Array<any>) {
      const api = new constructor(...args);

      // Hide all other properties and methods, except
      // those declared in the manifest
      for (var property in api) {
        if (property in constructor.manifest) {
          Object.defineProperty(api, property, {
            enumerable: true,
            configurable: false,
            writable: true,
            value: api[property],
          });
        } else {
          Object.defineProperty(api, property, {
            enumerable: false,
            configurable: false,
            writable: true,
            value: api[property],
          });
        }
      }
      for (var property in constructor.manifest) {
        Object.defineProperty(api, property, {
          enumerable: true,
          configurable: false,
          writable: true,
          value: api[property],
        });
      }

      return api;
    };
  };
}
