var assign = require('lodash.assign');
var create = require('lodash.create');
var findWhere = require('lodash.findwhere');

var XmlTemplater = require('./xmlTemplater');
var SubContent = require('./subContent');
var xmlUtil = require('./xmlUtil');

var DocXTemplater = function DocXTemplater(content, options) {
    content = content || '';
    options = assign({}, options);

    XmlTemplater.prototype.constructor.call(this, '', options);
    this.currentClass = DocXTemplater;
    this.tagXml = 'w:t';
    this.tagRawXml = 'w:p';
    this.load(content);
};

DocXTemplater.prototype = create(XmlTemplater.prototype, {
    constructor: DocXTemplater,

    calcIntellegentlyDashElement: function () {
        var outerLoop = new SubContent(this.content).getOuterLoop(this.templaterState);
        var start = outerLoop.start;
        var end = outerLoop.end;
        var scopeContent = xmlUtil.getListXmlElements(this.content, start, end - start);

        return findWhere(scopeContent, {tag: '<w:tc>'})
            ? 'w:tr'
            : XmlTemplater.prototype.calcIntellegentlyDashElement.call(this);
    }
});

module.exports = DocXTemplater;
