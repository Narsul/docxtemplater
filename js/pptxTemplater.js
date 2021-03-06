var PptXTemplater, SubContent, XmlTemplater, xmlUtil,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

XmlTemplater = require('./xmlTemplater');

xmlUtil = require('./xmlUtil');

SubContent = require('./subContent');

PptXTemplater = PptXTemplater = (function(superClass) {
  extend(PptXTemplater, superClass);

  function PptXTemplater(content, options) {
    if (content == null) {
      content = "";
    }
    if (options == null) {
      options = {};
    }
    PptXTemplater.__super__.constructor.call(this, content, options);
    this.currentClass = PptXTemplater;
    this.tagXml = 'a:t';
    this.tagRawXml = 'p:sp';
    this.load(content);
  }

  PptXTemplater.prototype.xmlToBeReplaced = function(options) {
    var str;
    if (options.noStartTag) {
      return options.insideValue;
    } else {
      str = this.templaterState.matches[options.xmlTagNumber][1] + options.insideValue;
      if (options.noEndTag === true) {
        return str;
      } else {
        return str + ("</" + this.tagXml + ">");
      }
    }
  };

  PptXTemplater.prototype.calcIntellegentlyDashElement = function() {
    var content, end, i, len, ref, scopeContent, start, t;
    ref = new SubContent(this.content).getOuterLoop(this.templaterState), content = ref.content, start = ref.start, end = ref.end;
    scopeContent = xmlUtil.getListXmlElements(this.content, start, end - start);
    for (i = 0, len = scopeContent.length; i < len; i++) {
      t = scopeContent[i];
      if (t.tag === '<a:tc>') {
        return 'a:tr';
      }
    }
    return PptXTemplater.__super__.calcIntellegentlyDashElement.call(this);
  };

  return PptXTemplater;

})(XmlTemplater);

module.exports = PptXTemplater;
