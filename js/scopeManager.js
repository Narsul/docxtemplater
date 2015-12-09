var assign = require('lodash.assign');
var forEach = require('lodash.forEach');
var isArray = require('lodash.isarray');
var isNumber = require('lodash.isnumber');
var isNull = require('lodash.isnull');
var isPlainObject = require('lodash.isplainobject');
var isString = require('lodash.isstring');
var pick = require('lodash.pick');
var reduce = require('lodash.reduce');

var DocUtils = require('./docUtils');
var Errors = require("./errors");

var ScopeManager = function ScopeManager(arg) {
    assign(this, pick(arg, ['tags', 'scopePath', 'usedTags', 'scopeList', 'parser', 'moduleManager', 'nullGetter', 'delimiters']));
    this.moduleManager.scopeManager = this;
};

assign(ScopeManager.prototype, {
    loopOver: function (tag, callback, inverted) {
        inverted = inverted || false;
        var value = this.getValue(tag);
        return this.loopOverValue(value, callback, inverted);
    },

    loopOverValue: function (value, callback, inverted) {
        if (inverted) {
            if (isNull(value)) {
                return callback(this.scopeList[this.num]);
            }
            if (!value) {
                return callback(this.scopeList[this.num]);
            }
            if (isArray(value) && !value.length) {
                callback(this.scopeList[this.num]);
            }
            return;
        }
        if (isNull(value)) {
            return;
        }
        if (isArray(value)) {
            forEach(value, callback);
        }
        if (isPlainObject(value)) {
            callback(value);
        }
        if (value === true) {
            return callback(this.scopeList[this.num]);
        }
    },

    getValue: function (tag, num) {
        var err;
        this.num = num != null ? num : (this.scopeList.length - 1);
        var scope = this.scopeList[this.num];
        try {
            var parser = this.parser(tag);
        } catch (error) {
            err = new Errors.XTScopeParserError('Scope parser compilation failed');
            err.properties = {
                id: 'scopeparser_compilation_failed',
                tag: tag,
                explanation: 'The scope parser for the tag ' + tag + ' failed to compile'
            };
            throw err;
        }
        try {
            var result = parser.get(scope);
        } catch (error) {
            err = new Errors.XTScopeParserError('Scope parser execution failed');
            err.properties = {
                id: 'scopeparser_execution_failed',
                explanation: 'The scope parser for the tag ' + tag + ' failed to execute',
                scope: scope,
                tag: tag
            };
            throw err;
        }
        if ((result == null) && this.num > 0) {
            return this.getValue(tag, this.num - 1);
        }
        return result;
    },

    getValueFromScope: function (tag) {
        var value;
        var result = this.getValue(tag);
        if (result != null) {
            if (isString(result)) {
                this.useTag(tag, true);
                value = result;
            } else if (isNumber(result)) {
                value = String(result);
            } else {
                value = result;
            }
        } else {
            this.useTag(tag, false);
            return null;
        }
        return value;
    },

    useTag: function (tag, val) {
        var u = reduce(this.scopePath, function(memo, s){
            if (memo[s] == null) {
                memo[s] = {};
            }
            return memo[s];
        }, val ? this.usedTags.def : this.usedTags.undef);
        if (tag !== '') {
            return u[tag] = true;
        }
    }
});


module.exports = ScopeManager;