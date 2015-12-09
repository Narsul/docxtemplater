var DocUtils, XmlMatcher,
  slice = [].slice;

DocUtils = require('./docUtils');

module.exports = XmlMatcher = (function() {
  function XmlMatcher(content) {
    this.content = content;
  }

  XmlMatcher.prototype.parse = function(tagXml) {
    var i;
    this.tagXml = tagXml;
    this.matches = DocUtils.pregMatchAll("(<" + this.tagXml + "[^>]*>)([^<>]*)</" + this.tagXml + ">", this.content);
    this.charactersAdded = (function() {
      var j, ref, results;
      results = [];
      for (i = j = 0, ref = this.matches.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        results.push(0);
      }
      return results;
    }).call(this);
    this.handleRecursiveCase();
    return this;
  };

  XmlMatcher.prototype.handleRecursiveCase = function() {

    /*
    		Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
    		For example with this string "I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping",
    			- we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift) (in this case 'I am')
    			- we need to match the string that is at the right of a <w:t> (that's the role of replacerPush) (in this case 'sleeping')
    		the test: describe "scope calculation" it "should compute the scope between 2 <w:t>" makes sure that this part of code works
    		It should even work if they is no XML at all, for example if the code is just "I am sleeping", in this case however, they should only be one match
     */
    var regex, replacerPush, replacerUnshift;
    replacerUnshift = (function(_this) {
      return function() {
        var j, match, offset, pn, string;
        match = arguments[0], pn = 4 <= arguments.length ? slice.call(arguments, 1, j = arguments.length - 2) : (j = 1, []), offset = arguments[j++], string = arguments[j++];
        match = pn[0] + pn[1];
        pn.unshift(match);
        pn.offset = offset;
        pn.first = true;
        _this.matches.unshift(pn);
        return _this.charactersAdded.unshift(0);
      };
    })(this);
    if (this.content.indexOf('<') === -1 && this.content.indexOf('>') === -1) {
      this.content.replace(/^()([^<>]*)$/, replacerUnshift);
    }
    regex = "^()([^<]+)<\/" + this.tagXml + ">";
    this.content.replace(new RegExp(regex), replacerUnshift);
    replacerPush = (function(_this) {
      return function() {
        var j, match, offset, pn, string;
        match = arguments[0], pn = 4 <= arguments.length ? slice.call(arguments, 1, j = arguments.length - 2) : (j = 1, []), offset = arguments[j++], string = arguments[j++];
        pn.unshift(match);
        pn.offset = offset;
        pn.last = true;
        _this.matches.push(pn);
        return _this.charactersAdded.push(0);
      };
    })(this);
    regex = "(<" + this.tagXml + "[^>]*>)([^>]+)$";
    this.content.replace(new RegExp(regex), replacerPush);
    return this;
  };

  return XmlMatcher;

})();
