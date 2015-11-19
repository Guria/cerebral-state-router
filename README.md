# cerebral-state-router
An opinionated state-driven URL change handler for Cerebral

```js
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
```
See [tests](/tests/test.js) for details