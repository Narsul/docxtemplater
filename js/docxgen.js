var assign = require('lodash.assign');
var isEmpty = require('lodash.isempty');
var jsZip = require('jszip');
var keys = require('lodash.keys');
var pick = require('lodash.pick');
var pluck = require('lodash.pluck');
var Q = require('q');
var reduce = require('lodash.reduce');

var DocxGen = function DocxGen(content, options) {
    var ModuleManager = require('./moduleManager');
    this.moduleManager = new ModuleManager();
    this.moduleManager.gen = this;
    this.templateClass = this.getTemplateClass();
    this.setOptions({});
    if (content) {
        this.load(content, options);
    }
};

assign(DocxGen.prototype, {
    attachModule: function (module) {
        this.moduleManager.attachModule(module);
        return this;
    },

    setOptions: function (options) {
        var docUtils = require('./docUtils');
        this.options = assign({}, options);
        reduce(docUtils.defaults, function (memo, defaultValue, key) {
            memo[key] = this.options[key] || defaultValue;
            return memo;
        }.bind(this), this);
        return this;
    },

    getTemplateClass: function () {
        var DocXTemplater = require('./docxTemplater');
        return DocXTemplater;
    },

    getTemplatedFiles: function () {
        var slideTemplates = pluck(this.zip.file(/word\/(header|footer)\d+\.xml/), 'name');
        return slideTemplates.concat(['word/document.xml']);
    },

    load: function (content, options) {
        this.moduleManager.sendEvent('loading');
        this.zip = content.file
            ? content
            : new jsZip(content, options);
        this.moduleManager.sendEvent('loaded');
        this.templatedFiles = this.getTemplatedFiles();
        return this;
    },

    renderFile: function (fileName) {
        this.moduleManager.sendEvent('rendering-file', fileName);
        var currentFile = this.createTemplateClass(fileName);
        return Q.when(currentFile.render())
            .then(function (template) {
                this.zip.file(fileName, template.content);
                this.moduleManager.sendEvent('rendered-file', fileName);
            }.bind(this));
    },

    render: function () {
        this.moduleManager.sendEvent('rendering');
        var renderPromises = reduce(this.templatedFiles, function (memo, fileName) {
            if (this.zip.files[fileName]) {
                memo.push(this.renderFile(fileName));
            }
            return memo;
        }.bind(this), []);
        return Q.all(renderPromises)
            .then(function () {
                this.moduleManager.sendEvent('rendered');
            }.bind(this));
    },

    getTags: function () {
        return reduce(this.templatedFiles, function (usedTags, fileName) {
            if (!this.zip.files[fileName]) {
                return usedTags;
            }
            var currentFile = this.createTemplateClass(fileName);
            var usedTemplateV = currentFile.render().usedTags;
            if (!isEmpty(usedTemplateV)) {
                usedTags.push({fileName: fileName, vars: usedTemplateV});
            }
            return usedTags;
        }.bind(this), []);
    },

    setData: function (tags) {
        this.tags = tags;
        return this;
    },

    getZip: function () {
        return this.zip;
    },

    createTemplateClass: function (path) {
        var docUtils = require('./docUtils');
        var usedData = this.zip.files[path].asText();
        var obj = {
            tags: this.tags,
            moduleManager: this.moduleManager
        };
        assign(obj, pick(this, keys(docUtils.defaults)));
        return new this.templateClass(usedData, obj);
    },

    getFullText: function (path) {
        path = path || 'word/document.xml';
        return this.createTemplateClass(path).getFullText();
    }
});

DocxGen.DocUtils = require('./docUtils');
DocxGen.DocXTemplater = require('./docxTemplater');
DocxGen.Errors = require('./errors');
DocxGen.ModuleManager = require('./moduleManager');
DocxGen.XmlTemplater = require('./xmlTemplater');
DocxGen.XmlMatcher = require('./xmlMatcher');
DocxGen.XmlUtil = require('./xmlUtil');
DocxGen.SubContent = require('./subContent');

module.exports = DocxGen;