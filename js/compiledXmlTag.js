var assign = require('lodash.assign');
var map = require('lodash.map');

var CompiledXmlTag = function CompiledXmlTag(compiled) {
    compiled = compiled || [];
    this.set(compiled);
};

assign(CompiledXmlTag.prototype, {
    'set': function (compiled) {
        compiled = compiled || [];

        if (this.null) {
            return this;
        }

        this.compiled = [];
        return map(compiled, function (text) {
            return text === ''
                ? void 0
                : this.compiled.push(text);
        }.bind(this));
    },

    prependText: function (text) {
        if (this.null) {
            return this;
        }

        if (text !== '') {
            this.compiled.unshift(text);
        }
        return this;
    },

    appendText: function (text) {
        if (this.null) {
            return this;
        }

        if (text !== '') {
            this.compiled.push(text);
        }
        return this;
    }
});

assign(CompiledXmlTag, {
    'null': function () {
        var obj = new CompiledXmlTag();
        obj.null = true;
        return obj;
    }
});

module.exports = CompiledXmlTag;
