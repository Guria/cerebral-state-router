var addressbar = require('addressbar');
var objectPath = require('object-path');
var urlMapper = require('url-mapper')({ query: true });

function setStore(input, state) {
    state.merge([], input.params);
}

function router (controller, routesConfig, options) {

    options = options || {};
    
    if(!routesConfig) {
        throw new Error('Cerebral router - Routes configuration wasn\'t provided.');
    }
    
    if (!options.baseUrl && options.onlyHash) {
        // autodetect baseUrl
        options.baseUrl = addressbar.pathname;
    }
    options.baseUrl = (options.baseUrl || '') + (options.onlyHash ? '#' : '');

    function getUrl(state) {
        var url;
        var routes = Object.keys(routesConfig);
        for (var i = 0; i < routes.length; ++i) {
            var match = true;
            var route = routes[i];

            var params = Object.keys(routesConfig[route]).reduce(function(initial, key){
                var path = routesConfig[route][key];
                var value = objectPath.get(state, path);

                if (typeof value !== 'undefined') {
                    if (key[0] === ':') {
                        initial[key.slice(1)] = value;
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

        return url;
    }

    function onControllerChange() {
        var url = getUrl(controller.get());
        addressbar.value = options.baseUrl + url;
    }

    function onUrlChange (event) {
        var url = event ? event.target.value : addressbar.value;
        url = url.replace(addressbar.origin, '');
    
        if (options.onlyHash && !~url.indexOf('#')) {
            // treat hash absense as root route
            url = url + '#/';
        }

        var matchedRoute = urlMapper.map(url, routesConfig);
        if (matchedRoute) {
            var match = matchedRoute.match;
            var values = matchedRoute.values;
            var params = Object.keys(match).reduce(function(initial, key){
                var value;
                var path = match[key];

                if (key[0] === ':') {
                    value = values[key.slice(1)];
                } else {
                    value = key;
                }

                objectPath.set(initial, path, value);

                return initial;
            }, {});
            controller.signals.routeChanged.sync({
                params: params
            });
        }
    }

    controller.signal('routeChanged', [ setStore ]);
    controller.signals.routeChanged.getUrl = getUrl;
    controller.on('change', onControllerChange);
    addressbar.on('change', onUrlChange);
    
    return controller.services.router = {
        trigger: onUrlChange,

        redirect: function(url, params) {

            params = params || {};
            params.replace = (typeof params.replace === "undefined") ? true : params.replace;

            addressbar.value = {
                value: options.baseUrl + url,
                replace: params.replace
            };

            onUrlChange();
        },

        getUrl: function() {
            return addressbar.value.replace(addressbar.origin + options.baseUrl, '');
        },

        detach: function(){
            addressbar.removeListener('change', onUrlChange);
            controller.removeListener('change', onControllerChange);
        }
    };
}

module.exports = router;
