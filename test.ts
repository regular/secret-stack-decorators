const test = require('tape');
const SecretStack = require('secret-stack');
import {plugin, muxrpc} from './index';

test('can create a class-based plugin for secret-stack', (t: any) => {
  t.plan(5);

  @plugin('1.2.3')
  class database {
    constructor(api: any, config: any) {
      t.ok(api, 'class constructor gets 1st argument: api');
      t.ok(config, 'class constructor gets 2nd argument: config');
    }

    @muxrpc('sync')
    store = (x: any) => {
      return x * 10;
    };
  }

  var App = SecretStack({
    appKey: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=',
  }).use(database);

  var app = App({});

  t.ok(app.database, 'our plugin exists in the resulting api');
  t.ok(app.database.store, 'our plugin method exists in the resulting api');
  t.equals(app.database.store(2), 20, 'our plugin method works as expected');

  app.close();
  t.end();
});
