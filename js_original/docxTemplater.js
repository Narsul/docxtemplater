var DocXTemplater, SubContent, XmlTemplater, xmlUtil,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

XmlTemplater = require('./xmlTemplater');

SubContent = require('./subContent');

xmlUtil = require('./xmlUtil');

DocXTemplater = DocXTemplater = (function(superClass) {
  extend(DocXTemplater, superClass);

  function DocXTemplater(content, options) {
    if (content == null) {
      content = "";
    }
    if (options == null) {
      options = {};
    }
    DocXTemplater.__super__.constructor.call(this, "", options);
    this.currentClass = DocXTemplater;
    this.tagXml = 'w:t';
    this.tagRawXml = 'w:p';
    this.load(content);
  }

  DocXTemplater.prototype.calcIntellegentlyDashElement = function() {
    var content, end, i, len, ref, scopeContent, start, t;
    ref = new SubContent(this.content).getOuterLoop(this.templaterState), content = ref.content, start = ref.start, end = ref.end;
    scopeContent = xmlUtil.getListXmlElements(this.content, start, end - start);
    for (i = 0, len = scopeContent.length; i < len; i++) {
      t = scopeContent[i];
      if (t.tag === '<w:tc>') {
        return 'w:tr';
      }
    }
    return DocXTemplater.__super__.calcIntellegentlyDashElement.call(this);
  };

  return DocXTemplater;

})(XmlTemplater);

module.exports = DocXTemplater;
