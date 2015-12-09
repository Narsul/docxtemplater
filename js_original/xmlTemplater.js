var CompiledTemplate, CompiledXmlTag, DocUtils, Errors, ModuleManager, ScopeManager, SubContent, TemplaterState, XmlMatcher, XmlTemplater, getFullText;

DocUtils = require('./docUtils');

ScopeManager = require('./scopeManager');

SubContent = require('./subContent');

TemplaterState = require('./templaterState');

XmlMatcher = require('./xmlMatcher');

ModuleManager = require('./moduleManager');

CompiledTemplate = require('./compiledTemplate');

CompiledXmlTag = require('./compiledXmlTag');

Errors = require("./errors");

getFullText = function(content, tagXml) {
  var match, matcher, output;
  matcher = new XmlMatcher(content).parse(tagXml);
  output = (function() {
    var i, len, ref, results;
    ref = matcher.matches;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      match = ref[i];
      results.push(match[2]);
    }
    return results;
  })();
  return DocUtils.wordToUtf8(DocUtils.convertSpaces(output.join("")));
};

module.exports = XmlTemplater = (function() {
  function XmlTemplater(content, options) {
    if (content == null) {
      content = "";
    }
    if (options == null) {
      options = {};
    }
    this.tagXml = '';
    this.tagRawXml = '';
    this.currentClass = XmlTemplater;
    this.fromJson(options);
    this.templaterState = new TemplaterState(this.moduleManager, this.delimiters);
  }

  XmlTemplater.prototype.load = function(content1) {
    var err, xmlMatcher;
    this.content = content1;
    if (typeof this.content !== "string") {
      err = new Errors.XTInternalError("Content must be a string");
      err.properties.id = "xmltemplater_content_must_be_string";
      throw err;
    }
    xmlMatcher = new XmlMatcher(this.content).parse(this.tagXml);
    this.templaterState.matches = xmlMatcher.matches;
    return this.templaterState.charactersAdded = xmlMatcher.charactersAdded;
  };

  XmlTemplater.prototype.fromJson = function(options) {
    var defaultValue, key, ref;
    if (options == null) {
      options = {};
    }
    this.tags = options.tags != null ? options.tags : {};
    this.scopePath = options.scopePath != null ? options.scopePath : [];
    this.scopeList = options.scopeList != null ? options.scopeList : [this.tags];
    this.usedTags = options.usedTags != null ? options.usedTags : {
      def: {},
      undef: {}
    };
    ref = DocUtils.defaults;
    for (key in ref) {
      defaultValue = ref[key];
      this[key] = options[key] != null ? options[key] : defaultValue;
    }
    this.moduleManager = options.moduleManager != null ? options.moduleManager : new ModuleManager();
    return this.scopeManager = new ScopeManager({
      tags: this.tags,
      scopePath: this.scopePath,
      usedTags: this.usedTags,
      scopeList: this.scopeList,
      parser: this.parser,
      moduleManager: this.moduleManager,
      delimiters: this.delimiters
    });
  };

  XmlTemplater.prototype.toJson = function() {
    var defaultValue, key, obj, ref;
    obj = {
      tags: DocUtils.clone(this.scopeManager.tags),
      scopePath: DocUtils.clone(this.scopeManager.scopePath),
      scopeList: DocUtils.clone(this.scopeManager.scopeList),
      usedTags: this.scopeManager.usedTags,
      moduleManager: this.moduleManager
    };
    ref = DocUtils.defaults;
    for (key in ref) {
      defaultValue = ref[key];
      obj[key] = this[key];
    }
    return obj;
  };

  XmlTemplater.prototype.calcIntellegentlyDashElement = function() {
    return false;
  };

  XmlTemplater.prototype.getFullText = function() {
    return getFullText(this.content, this.tagXml);
  };

  XmlTemplater.prototype.updateModuleManager = function() {
    this.moduleManager.xmlTemplater = this;
    this.moduleManager.templaterState = this.templaterState;
    return this.moduleManager.scopeManager = this.scopeManager;
  };

  XmlTemplater.prototype.handleModuleManager = function(type, data) {
    this.updateModuleManager();
    return this.moduleManager.handle(type, data);
  };


  /*
  	content is the whole content to be tagged
  	scope is the current scope
  	returns the new content of the tagged content
   */

  XmlTemplater.prototype.render = function() {
    return this.compile();
  };

  XmlTemplater.prototype.compile = function() {
    var character, i, innerText, j, len, len1, length, loopType, match, numCharacter, numXmlTag, preContent, ref;
    this.sameTags = this.delimiters.start === this.delimiters.end;
    this.compiled = new CompiledTemplate();
    this.lastStart = 0;
    this.templaterState.initialize();
    this.handleModuleManager('xmlRendering');
    ref = this.templaterState.matches;
    for (numXmlTag = i = 0, len = ref.length; i < len; numXmlTag = ++i) {
      match = ref[numXmlTag];
      innerText = match[2];
      this.templaterState.offset[numXmlTag] = 0;
      if (this.templaterState.trail.length === 0 && !this.templaterState.inTag && innerText.indexOf(this.delimiters.start[0]) === -1 && innerText.indexOf(this.delimiters.end[0]) === -1) {
        continue;
      }
      for (numCharacter = j = 0, len1 = innerText.length; j < len1; numCharacter = ++j) {
        character = innerText[numCharacter];
        this.templaterState.trail += character;
        length = !this.templaterState.inTag ? this.delimiters.start.length : this.delimiters.end.length;
        this.templaterState.trail = this.templaterState.trail.substr(-length, length);
        this.templaterState.currentStep = {
          'numXmlTag': numXmlTag,
          'numCharacter': numCharacter
        };
        this.templaterState.trailSteps.push({
          'numXmlTag': numXmlTag,
          'numCharacter': numCharacter
        });
        this.templaterState.trailSteps = this.templaterState.trailSteps.splice(-this.delimiters.start.length, this.delimiters.start.length);
        this.templaterState.context += character;
        if ((this.sameTags === true && this.templaterState.inTag === false && this.templaterState.trail === this.delimiters.start) || (this.sameTags === false && this.templaterState.trail === this.delimiters.start)) {
          this.templaterState.startTag();
        } else if ((this.sameTags === true && this.templaterState.inTag === true && this.templaterState.trail === this.delimiters.end) || (this.sameTags === false && this.templaterState.trail === this.delimiters.end)) {
          this.updateModuleManager();
          this.templaterState.endTag();
          loopType = this.templaterState.loopType();
          if (loopType === 'simple') {
            this.replaceSimpleTag();
          }
          if (loopType === 'xml') {
            this.replaceSimpleTagRawXml();
          }
          if (loopType === 'dash' || loopType === 'for') {
            if (this.templaterState.isLoopClosingTag()) {
              this.replaceLoopTag();
              this.templaterState.finishLoop();
            }
          }
          if (['simple', 'dash', 'for', 'xml'].indexOf(loopType) === -1) {
            this.handleModuleManager('replaceTag', loopType);
          }
        } else {
          if (this.templaterState.inTag === true) {
            this.templaterState.textInsideTag += character;
          }
        }
      }
    }
    this.handleModuleManager('xmlRendered');
    preContent = this.content.substr(this.lastStart);
    this.compiled.appendText(preContent);
    return this;
  };

  XmlTemplater.prototype.replaceSimpleTag = function() {
    var newValue;
    newValue = this.scopeManager.getValueFromScope(this.templaterState.textInsideTag);
    if (newValue == null) {
      newValue = this.nullGetter(this.templaterState.textInsideTag, {
        tag: 'simple'
      });
    }
    return this.content = this.replaceTagByValue(DocUtils.utf8ToWord(newValue), this.content);
  };

  XmlTemplater.prototype.replaceSimpleTagRawXml = function() {
    var err, error, error1, fullText, newText, outerXml, preContent, startTag, subContent;
    newText = this.scopeManager.getValueFromScope(this.templaterState.tag);
    if (newText == null) {
      newText = this.nullGetter(this.templaterState.tag, {
        tag: 'raw'
      });
    }
    subContent = new SubContent(this.content);
    subContent.getInnerTag(this.templaterState);
    try {
      outerXml = subContent.getOuterXml(this.tagRawXml);
    } catch (error1) {
      error = error1;
      if (error instanceof Errors.XTTemplateError) {
        error.properties.id = "raw_tag_outerxml_invalid";
        error.properties.xtag = this.templaterState.textInsideTag;
        error.properties.explanation = "The raw tag " + error.properties.xtag + " is not valid in this context.";
      }
      throw error;
    }
    fullText = getFullText(outerXml.text, this.tagXml);
    if (this.templaterState.fullTextTag !== fullText) {
      err = new Errors.XTTemplateError("Raw xml tag should be the only text in paragraph");
      err.properties = {
        id: "raw_xml_tag_should_be_only_text_in_paragraph",
        paragraphContent: fullText,
        fullTag: this.templaterState.fullTextTag,
        xtag: this.templaterState.textInsideTag,
        explanation: "The tag : '" + this.templaterState.fullTextTag + "' should be the the only text in the paragraph (it contains '" + fullText + "')"
      };
      throw err;
    }
    startTag = outerXml.start;
    preContent = this.content.substr(this.lastStart, startTag - this.lastStart);
    this.compiled.appendText(preContent);
    this.lastStart = startTag;
    this.compiled.appendRaw(this.templaterState.tag);
    return this.replaceXml(outerXml, newText);
  };

  XmlTemplater.prototype.replaceXml = function(subContent, newText) {
    this.templaterState.moveCharacters(this.templaterState.tagStart.numXmlTag, newText.length, subContent.text.length);
    return this.content = subContent.replace(newText).fullText;
  };

  XmlTemplater.prototype.deleteTag = function(xml, tag) {
    var xmlText;
    this.templaterState.tagStart = tag.start;
    this.templaterState.tagEnd = tag.end;
    this.templaterState.textInsideTag = tag.raw;
    return xmlText = this.replaceTagByValue("", xml);
  };

  XmlTemplater.prototype.deleteOuterTags = function(outerXmlText) {
    return this.deleteTag(this.deleteTag(outerXmlText, this.templaterState.loopOpen), this.templaterState.loopClose);
  };

  XmlTemplater.prototype.dashLoop = function(elementDashLoop, sharp) {
    var error, error1, innerXmlText, outerXml, outerXmlText, subContent;
    if (sharp == null) {
      sharp = false;
    }
    subContent = new SubContent(this.content);
    subContent.getInnerLoop(this.templaterState);
    try {
      outerXml = subContent.getOuterXml(elementDashLoop);
    } catch (error1) {
      error = error1;
      if (error instanceof Errors.XTTemplateError) {
        error.properties.id = "dashloop_tag_outerxml_invalid";
        error.properties.xtag = this.templaterState.textInsideTag;
        error.properties.explanation = "The dashLoop tag " + error.properties.xtag + " is not valid in this context.";
      }
      throw error;
    }
    this.templaterState.moveCharacters(0, 0, outerXml.start);
    outerXmlText = outerXml.text;
    innerXmlText = this.deleteOuterTags(outerXmlText, sharp);
    this.templaterState.moveCharacters(0, outerXml.start, 0);
    this.templaterState.moveCharacters(this.templaterState.tagStart.numXmlTag, outerXmlText.length, innerXmlText.length);
    return this.forLoop(outerXml, innerXmlText);
  };

  XmlTemplater.prototype.xmlToBeReplaced = function(options) {
    var after, before;
    before = "";
    after = "";
    if (options.noStartTag) {
      return options.insideValue;
    }
    if (options.spacePreserve) {
      before = "<" + this.tagXml + " xml:space=\"preserve\">";
    } else {
      before = this.templaterState.matches[options.xmlTagNumber][1];
    }
    if (!options.noEndTag) {
      after = "</" + this.tagXml + ">";
    }
    this.currentCompiledTag.prependText(before);
    this.currentCompiledTag.appendText(after);
    return before + options.insideValue + after;
  };

  XmlTemplater.prototype.replaceFirstFrom = function(string, search, replace, from) {
    var replaced, substr;
    substr = string.substr(from);
    replaced = substr.replace(search, replace);
    return string.substr(0, from) + replaced;
  };

  XmlTemplater.prototype.replaceXmlTag = function(content, options) {
    var err, preContent, replacer, startTag;
    this.templaterState.offset[options.xmlTagNumber] += options.insideValue.length - this.templaterState.matches[options.xmlTagNumber][2].length;
    options.spacePreserve = options.spacePreserve != null ? options.spacePreserve : true;
    options.noStartTag = options.noStartTag != null ? options.noStartTag : false;
    options.noEndTag = options.noEndTag != null ? options.noEndTag : false;
    replacer = this.xmlToBeReplaced(options);
    this.templaterState.matches[options.xmlTagNumber][2] = options.insideValue;
    startTag = this.templaterState.calcXmlTagPosition(options.xmlTagNumber);
    this.templaterState.moveCharacters(options.xmlTagNumber + 1, replacer.length, this.templaterState.matches[options.xmlTagNumber][0].length);
    if (content.indexOf(this.templaterState.matches[options.xmlTagNumber][0]) === -1) {
      err = new Errors.XTInternalError("Match not found in content");
      err.properties.id = "xmltemplater_replaced_cant_be_same_as_substring";
      err.properties.expectedMatch = this.templaterState.matches[options.xmlTagNumber][0];
      err.properties.content = content;
      throw err;
    }
    content = this.replaceFirstFrom(content, this.templaterState.matches[options.xmlTagNumber][0], replacer, startTag);
    this.templaterState.matches[options.xmlTagNumber][0] = replacer;
    preContent = content.substr(this.lastStart, startTag - this.lastStart);
    if (this.templaterState.loopType() === "simple") {
      this.compiled.appendText(preContent);
      this.lastStart = startTag + this.templaterState.matches[options.xmlTagNumber][0].length;
      this.compiled.appendTag(this.currentCompiledTag);
    }
    return content;
  };

  XmlTemplater.prototype.replaceTagByValue = function(newValue, content) {
    var i, k, options, ref, ref1;
    options = {
      xmlTagNumber: this.templaterState.tagStart.numXmlTag,
      noStartTag: this.templaterState.matches[this.templaterState.tagStart.numXmlTag].first != null,
      noEndTag: this.templaterState.matches[this.templaterState.tagStart.numXmlTag].last != null
    };
    if (this.templaterState.tagEnd.numXmlTag === this.templaterState.tagStart.numXmlTag) {
      this.currentCompiledTag = new CompiledXmlTag([
        this.templaterState.getLeftValue(), {
          type: 'tag',
          tag: this.templaterState.textInsideTag
        }, this.templaterState.getRightValue()
      ]);
      options.insideValue = this.templaterState.getLeftValue() + newValue + this.templaterState.getRightValue();
      return this.replaceXmlTag(content, options);
    } else if (this.templaterState.tagEnd.numXmlTag > this.templaterState.tagStart.numXmlTag) {
      options.insideValue = newValue;
      this.currentCompiledTag = new CompiledXmlTag([
        {
          type: 'tag',
          tag: this.templaterState.textInsideTag
        }
      ]);
      if ((this.templaterState.matches[this.templaterState.tagStart.numXmlTag].first == null) && (this.templaterState.matches[this.templaterState.tagStart.numXmlTag].last == null)) {
        this.currentCompiledTag = new CompiledXmlTag([
          this.templaterState.getLeftValue(), {
            type: 'tag',
            tag: this.templaterState.textInsideTag
          }
        ]);
        options.insideValue = this.templaterState.getLeftValue() + newValue;
      }
      content = this.replaceXmlTag(content, options);
      options = {
        insideValue: "",
        spacePreserve: false
      };
      for (k = i = ref = this.templaterState.tagStart.numXmlTag + 1, ref1 = this.templaterState.tagEnd.numXmlTag; ref <= ref1 ? i < ref1 : i > ref1; k = ref <= ref1 ? ++i : --i) {
        options.xmlTagNumber = k;
        this.currentCompiledTag = new CompiledXmlTag([]);
        content = this.replaceXmlTag(content, options);
      }
      options = {
        insideValue: this.templaterState.getRightValue(),
        spacePreserve: true,
        xmlTagNumber: this.templaterState.tagEnd.numXmlTag,
        noEndTag: this.templaterState.matches[this.templaterState.tagEnd.numXmlTag].last != null
      };
      this.currentCompiledTag = CompiledXmlTag["null"]();
      return this.replaceXmlTag(content, options);
    }
  };

  XmlTemplater.prototype.replaceLoopTag = function() {
    var dashElement, innerTemplate, outerLoop;
    if (this.templaterState.loopType() === 'dash') {
      return this.dashLoop(this.templaterState.loopOpen.element);
    }
    if (this.intelligentTagging === true) {
      dashElement = this.calcIntellegentlyDashElement();
      if (dashElement !== false) {
        return this.dashLoop(dashElement, true);
      }
    }
    outerLoop = new SubContent(this.content).getOuterLoop(this.templaterState);
    innerTemplate = new SubContent(this.content).getInnerLoop(this.templaterState).text;
    return this.forLoop(outerLoop, innerTemplate);
  };

  XmlTemplater.prototype.calcSubXmlTemplater = function(innerTagsContent, argOptions) {
    var options;
    options = this.toJson();
    if (argOptions != null) {
      if (argOptions.tags != null) {
        options.tags = argOptions.tags;
        options.scopeList = options.scopeList.concat(argOptions.tags);
        options.scopePath = options.scopePath.concat(this.templaterState.loopOpen.tag);
      }
    }
    return (new this.currentClass(innerTagsContent, options)).render();
  };

  XmlTemplater.prototype.forLoop = function(outerTags, subTemplate) {

    /*
    			<w:t>{#forTag} blabla</w:t>
    			Blabla1
    			Blabla2
    			<w:t>{/forTag}</w:t>
    
    			Let subTemplate be what is in between the first closing tag and the second opening tag | blabla....Blabla2<w:t>|
    			Let outerTagsContent what is in between the first opening tag  and the last closing tag     |{#forTag} blabla....Blabla2<w:t>{/forTag}|
    			We replace outerTagsContent by n*subTemplate, n is equal to the length of the array in scope forTag
    			<w:t>subContent subContent subContent</w:t>
     */
    var newContent, preContent, startTag, subfile, tag;
    startTag = outerTags.start;
    preContent = this.content.substr(this.lastStart, startTag - this.lastStart);
    this.compiled.appendText(preContent);
    this.lastStart = outerTags.end;
    tag = this.templaterState.loopOpen.tag;
    newContent = "";
    this.scopeManager.loopOver(tag, (function(_this) {
      return function(subTags) {
        var subfile;
        subfile = _this.calcSubXmlTemplater(subTemplate, {
          tags: subTags
        });
        return newContent += subfile.content;
      };
    })(this), this.templaterState.loopIsInverted);
    subfile = this.calcSubXmlTemplater(subTemplate, {
      tags: {}
    });
    this.compiled.appendSubTemplate(subfile.compiled.compiled, tag, this.templaterState.loopIsInverted);
    this.lastStart += newContent.length - outerTags.text.length;
    return this.replaceXml(outerTags, newContent);
  };

  return XmlTemplater;

})();
