// MOCKING
global.window = {
  location: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000/initial'
  }
};
global.history = {
  pushState: function(_, _, value) {
    window.location.href = window.location.origin + value;
    window.location.lastChangedWith = 'pushState';
  },
  replaceState: function(_, _, value) {
    window.location.href = window.location.origin + value;
    window.location.lastChangedWith = 'replaceState';
  }
};
global.addEventListener = function () {};
global.document = {};

// SETUP
var Controller = require('cerebral');
var addressbar = require('addressbar');
var Model = require('cerebral-baobab');
var Router = require('./../index.js');

var controller = Controller(Model({
    core: {},
    todo: {}
}));
var router = Router(controller, {
   '/'             : { 'core': ['module'], 'home': ['core', 'view'] },
   '/login'        : { 'core': ['module'], 'login': ['core', 'view'] },
   '/:module'      : { ':module': ['module'], '': ['todo', 'filter']  },
   '/todo/:filter' : { 'todo': ['module'], ':filter': ['todo', 'filter'] },
});


module.exports['trigger'] = function (test) {
    addressbar.value = '/login';
    router.trigger();
    test.deepEqual(controller.get(), {
        module: 'core',
        core: { view: 'login' },
        todo: {}
    });

    addressbar.value = '/todo';
    router.trigger();
    test.deepEqual(controller.get(), {
        module: 'todo',
        core: { view: 'login' },
        todo: { filter: '' }
    });

    addressbar.value = '/todo/active';
    router.trigger();
    test.deepEqual(controller.get(), {
        module: 'todo',
        core: { view: 'login' },
        todo: { filter: 'active' }
    });

    addressbar.value = '/';
    router.trigger();
    test.deepEqual(controller.get(), {
        module: 'core',
        core: { view: 'home' },
        todo: { filter: 'active' }
    });
    test.done();
};

module.exports['signal call'] = function (test) {
    controller.signal('login', [function (input, state) {
        state.set(['module'], 'core');
        state.set(['core', 'view'], 'login');
    }]);
    controller.signal('todo', [function (input, state) {
        state.set(['module'], 'todo');
        state.set(['todo', 'filter'], '');
    }]);
    controller.signal('todoFilter', [function (input, state) {
        state.set(['module'], 'todo');
        state.set(['todo', 'filter'], 'active');
    }]);
    controller.signal('home', [function (input, state) {
        state.set(['module'], 'core');
        state.set(['core', 'view'], 'home');
    }]);

    controller.signals.login.sync();
    test.equal(addressbar.value, 'http://localhost:3000/login');

    controller.signals.todo.sync();
    test.equal(addressbar.value, 'http://localhost:3000/todo');

    controller.signals.todoFilter.sync();
    test.equal(addressbar.value, 'http://localhost:3000/todo/active');

    controller.signals.home.sync();
    test.equal(addressbar.value, 'http://localhost:3000/');

    test.done();
};

module.exports['getUrl'] = function(test) {
    test.equal(controller.signals.routeChanged.getUrl({
        module: 'todo',
        core: { view: 'login' },
        todo: { filter: 'active' }
    }), '/todo/active');
    test.done();
}
