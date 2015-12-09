var assign = require('lodash.assign');

var Errors = require('./errors');

var CompiledTemplate = function CompiledTemplate () {
    this.compiled = [];
};

assign(CompiledTemplate.prototype, {
    prependText : function (text) {
        this.compiled.unshift(text);
        return this;
    },

    appendTag : function (compiledTag) {
        if (!compiledTag) {
            var err = new Errors.XTInternalError('Compiled tag empty');
            err.properties.id = 'tag_appended_empty';
            throw err;
        }
        this.compiled = this.compiled.concat(compiledTag.compiled);
        return this;
    },

    appendRaw : function (tag) {
        this.compiled.push({type : 'raw', tag  : tag});
        return this;
    },

    appendText : function (text) {
        if (text !== '') {
            this.compiled.push(text);
        }
        return this;
    },

    appendSubTemplate : function (subTemplate, tag, inverted) {
        if (!subTemplate) {
            var err = new Errors.XTInternalError('Subtemplate empty');
            err.properties.id = 'subtemplate_appended_empty';
            throw err;
        }
        return this.compiled.push({
            type     : 'loop',
            tag      : tag,
            inverted : inverted,
            template : subTemplate
        });
    }
});

module.exports = CompiledTemplate;
