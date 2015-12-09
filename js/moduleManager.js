var assign = require('lodash.assign');
var invoke = require('lodash.invoke');
var isNull = require('lodash.isnull');
var isUndefined = require('lodash.isundefined');
var reduce = require('lodash.reduce');

var ModuleManager = function ModuleManager() {
    this.modules = [];
};

assign(ModuleManager.prototype, {
    attachModule: function (module) {
        this.modules.push(module);
        module.manager = this;
        return this;
    },

    sendEvent: function (eventName, data) {
        return invoke(this.modules, 'handleEvent', eventName, data);
    },

    'get': function (value) {
        return reduce(this.modules, function (result, module) {
            var moduleValue = module.get(value);
            return isNull(moduleValue) || isUndefined(moduleValue) ? result : moduleValue;
        }, null);
    },

    handle: function (type, data) {
        return reduce(this.modules, function (result, module) {
            if (isNull(result) || isUndefined(result)) {
                var handleResult = module.handle(type, data);
                return isNull(handleResult) || isUndefined(handleResult) ? result : handleResult;
            }
            return result;
        }, null);
    },

    getInstance: function (obj) {
        return this[obj];
    }
});

module.exports = ModuleManager;