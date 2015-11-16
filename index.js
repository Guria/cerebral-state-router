var pathToRegexp = require('path-to-regexp');
var addressbar = require('addressbar');
var urlMapper = require('url-mapper')();

function setStore(input, state) {
    input.params.forEach(function(param){
        state.set(param.path, param.value);
    });
}

function router (controller, routesConfig, options) {

    function onChange() {
        var url;
        var routes = Object.keys(routesConfig);
        for (var i = 0; i < routes.length; ++i) {
            var match = true;
            var route = routes[i];

            var params = Object.keys(routesConfig[route]).reduce(function(initial, key){
                var path = routesConfig[route][key];
                var value = controller.get(path);
                if (typeof value !== 'undefined') {
                    if (key[0] === ':') {
                        initial[key.slice(1)] = controller.get(path);
                    } else if (value !== key) {
                        match = false;
                    }
                } else {
                    match = false;
                }

                return initial;
            }, {});

            if (match) {
                url = urlMapper.stringify(route, params);
                break;
            }
        }

        addressbar.value = url;
    }

    controller.signal('routeChanged', [ setStore ]);
    controller.on('change', onChange);
    
    return {
        trigger: function(url) {
            urlMapper.map(url, routesConfig, function(match, values) {
                var params = Object.keys(match).map(function(key){
                    var value;
                    if (key[0] === ':') {
                        value = values[key.slice(1)];
                    } else {
                        value = key;
                    }
                    var path = match[key];
                    return { path: path, value: value };
                });
                controller.signals.routeChanged.sync({
                    params: params
                });
            });
        }
    };
}

module.exports = router;