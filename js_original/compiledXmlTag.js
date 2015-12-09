var CompiledXmlTag;

CompiledXmlTag = CompiledXmlTag = (function() {
  function CompiledXmlTag(compiled) {
    if (compiled == null) {
      compiled = [];
    }
    this.set(compiled);
  }

  CompiledXmlTag.prototype.set = function(compiled) {
    var i, len, results, text;
    if (compiled == null) {
      compiled = [];
    }
    if (this["null"]) {
      return this;
    }
    this.compiled = [];
    results = [];
    for (i = 0, len = compiled.length; i < len; i++) {
      text = compiled[i];
      if (text !== '') {
        results.push(this.compiled.push(text));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  CompiledXmlTag.prototype.prependText = function(text) {
    if (this["null"]) {
      return this;
    }
    if (text !== '') {
      this.compiled.unshift(text);
    }
    return this;
  };

  CompiledXmlTag.prototype.appendText = function(text) {
    if (this["null"]) {
      return this;
    }
    if (text !== '') {
      this.compiled.push(text);
    }
    return this;
  };

  return CompiledXmlTag;

})();

CompiledXmlTag["null"] = function() {
  var obj;
  obj = new CompiledXmlTag();
  obj["null"] = true;
  return obj;
};

module.exports = CompiledXmlTag;
