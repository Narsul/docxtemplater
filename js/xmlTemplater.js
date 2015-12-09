var assign = require('lodash.assign');
var defaults = require('lodash.defaults');
var isString = require('lodash.isstring');
var pick = require('lodash.pick');
var pluck = require('lodash.pluck');
var keys = require('lodash.keys');

var DocUtils = require('./docUtils');
var ScopeManager = require('./scopeManager');
var SubContent = require('./subContent');
var TemplaterState = require('./templaterState');
var XmlMatcher = require('./xmlMatcher');
var ModuleManager = require('./moduleManager');
var CompiledTemplate = require('./compiledTemplate');
var CompiledXmlTag = require('./compiledXmlTag');
var Errors = require('./errors');

var getFullText = function (content, tagXml) {
  var matcher = new XmlMatcher(content).parse(tagXml);
  // get only the text
  var output = pluck(matcher.matches, 2);
  // join it
  return DocUtils.wordToUtf8(DocUtils.convertSpaces(output.join('')));
};

// This is an abstract class, DocXTemplater is an example of inherited class
var XmlTemplater = function XmlTemplater (content, options) {
  options = assign({}, options);
  // tagXml represents the name of the tag that contains text. For example, in docx, @tagXml='w:t'
  this.tagXml = '';
  // tagRawXml represents the name of the tag that needs to be replaced when embedding raw XML using `{@rawXml}`.
  this.tagRawXml = '';
  // This is used because tags are recursive, so the class needs to be able to instanciate an object of the same class. I created a variable so you don't have to Override all functions relative to recursivity
  this.currentClass = XmlTemplater;
  this.fromJson(options);
  this.templaterState = new TemplaterState(this.moduleManager, this.delimiters);
};

assign(XmlTemplater.prototype, {

  load : function (content) {
    this.content = content;
    if (!isString(this.content)) {
      var err = new Errors.XTInternalError('Content must be a string');
      err.properties.id = 'xmltemplater_content_must_be_string';
      throw err;
    }
    var xmlMatcher = new XmlMatcher(this.content).parse(this.tagXml);
    this.templaterState.matches = xmlMatcher.matches;
    return this.templaterState.charactersAdded = xmlMatcher.charactersAdded;
  },

  fromJson : function (options) {
    options = assign({}, options);
    this.tags = options.tags || {};
    this.scopePath = options.scopePath || [];
    this.scopeList = options.scopeList || [this.tags];
    this.usedTags = options.usedTags || {def : {}, undef : {}};
    assign(this, defaults(options, DocUtils.defaults));
    this.moduleManager = options.moduleManager || new ModuleManager();
    return this.scopeManager = new ScopeManager({
      tags          : this.tags,
      scopePath     : this.scopePath,
      usedTags      : this.usedTags,
      scopeList     : this.scopeList,
      parser        : this.parser,
      moduleManager : this.moduleManager,
      delimiters    : this.delimiters
    });
  },

  toJson : function () {
    var obj = {
      tags          : DocUtils.clone(this.scopeManager.tags),
      scopePath     : DocUtils.clone(this.scopeManager.scopePath),
      scopeList     : DocUtils.clone(this.scopeManager.scopeList),
      usedTags      : this.scopeManager.usedTags,
      moduleManager : this.moduleManager
    };
    assign(obj, pick(this, keys(DocUtils.defaults)));
    return obj;
  },

// to be implemented by classes that inherit xmlTemplater, eg DocxTemplater
  calcIntellegentlyDashElement : function () {
    return false;
  },

  getFullText : function () {
    return getFullText(this.content, this.tagXml);
  },

  updateModuleManager : function () {
    this.moduleManager.xmlTemplater = this;
    this.moduleManager.templaterState = this.templaterState;
    return this.moduleManager.scopeManager = this.scopeManager;
  },

  handleModuleManager : function (type, data) {
    this.updateModuleManager();
    return this.moduleManager.handle(type, data);
  },


  /*
   content is the whole content to be tagged
   scope is the current scope
   returns the new content of the tagged content
   */
  render : function () {
    return this.compile();
  },

  compile : function () {
    var character, i, innerText, j, len, len1, length, loopType, match, numCharacter, numXmlTag, preContent, ref;
    this.sameTags = this.delimiters.start === this.delimiters.end;
    this.compiled = new CompiledTemplate();
    this.lastStart = 0;
    this.templaterState.initialize();
    this.handleModuleManager('xmlRendering');
    ref = this.templaterState.matches;
    for (numXmlTag = i = 0, len = ref.length; i < len; numXmlTag = ++i) {
      match = ref[numXmlTag];
      // text inside the <w:t>
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
          'numXmlTag'    : numXmlTag,
          'numCharacter' : numCharacter
        };
        this.templaterState.trailSteps.push({
          'numXmlTag'    : numXmlTag,
          'numCharacter' : numCharacter
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
  },

  replaceSimpleTag : function () {
    var newValue = this.scopeManager.getValueFromScope(this.templaterState.textInsideTag)
        || this.nullGetter(this.templaterState.textInsideTag, {tag : 'simple'});
    return this.content = this.replaceTagByValue(DocUtils.utf8ToWord(newValue), this.content);
  },

  replaceSimpleTagRawXml : function () {
    var newText = this.scopeManager.getValueFromScope(this.templaterState.tag)
        || this.nullGetter(this.templaterState.tag, {tag : 'raw'});
    var subContent = new SubContent(this.content);
    subContent.getInnerTag(this.templaterState);
    try {
      var outerXml = subContent.getOuterXml(this.tagRawXml);
    } catch (error) {
      if (error instanceof Errors.XTTemplateError) {
        error.properties.id = 'raw_tag_outerxml_invalid';
        error.properties.xtag = this.templaterState.textInsideTag;
        error.properties.explanation = 'The raw tag ' + error.properties.xtag + ' is not valid in this context.';
      }
      throw error;
    }
    var fullText = getFullText(outerXml.text, this.tagXml);
    if (this.templaterState.fullTextTag !== fullText) {
      var err = new Errors.XTTemplateError('Raw xml tag should be the only text in paragraph');
      err.properties = {
        id               : 'raw_xml_tag_should_be_only_text_in_paragraph',
        paragraphContent : fullText,
        fullTag          : this.templaterState.fullTextTag,
        xtag             : this.templaterState.textInsideTag,
        explanation      : 'The tag : "' + this.templaterState.fullTextTag + '" should be the the only text in the paragraph (it contains "' + fullText + '")'
      };
      throw err;
    }
    var startTag = outerXml.start;
    var preContent = this.content.substr(this.lastStart, startTag - this.lastStart);
    this.compiled.appendText(preContent);
    this.lastStart = startTag;
    this.compiled.appendRaw(this.templaterState.tag);
    return this.replaceXml(outerXml, newText);
  },

  replaceXml : function (subContent, newText) {
    this.templaterState.moveCharacters(this.templaterState.tagStart.numXmlTag, newText.length, subContent.text.length);
    return this.content = subContent.replace(newText).fullText;
  },

  deleteTag : function (xml, tag) {
    this.templaterState.tagStart = tag.start;
    this.templaterState.tagEnd = tag.end;
    this.templaterState.textInsideTag = tag.raw;
    return this.replaceTagByValue('', xml);
  },

  deleteOuterTags : function (outerXmlText) {
    return this.deleteTag(this.deleteTag(outerXmlText, this.templaterState.loopOpen), this.templaterState.loopClose);
  },

  dashLoop : function (elementDashLoop, sharp) {
    sharp = sharp || false;
    var subContent = new SubContent(this.content);
    subContent.getInnerLoop(this.templaterState);
    try {
      var outerXml = subContent.getOuterXml(elementDashLoop);
    } catch (error) {
      if (error instanceof Errors.XTTemplateError) {
        error.properties.id = 'dashloop_tag_outerxml_invalid';
        error.properties.xtag = this.templaterState.textInsideTag;
        error.properties.explanation = 'The dashLoop tag ' + error.properties.xtag + ' is not valid in this context.';
      }
      throw error;
    }
    this.templaterState.moveCharacters(0, 0, outerXml.start);
    var outerXmlText = outerXml.text;
    var innerXmlText = this.deleteOuterTags(outerXmlText, sharp);
    this.templaterState.moveCharacters(0, outerXml.start, 0);
    this.templaterState.moveCharacters(this.templaterState.tagStart.numXmlTag, outerXmlText.length, innerXmlText.length);
    return this.forLoop(outerXml, innerXmlText);
  },

  xmlToBeReplaced : function (options) {
    var after = '';
    if (options.noStartTag) {
      return options.insideValue;
    }
    var before = options.spacePreserve
        ? '<' + this.tagXml + ' xml:space="preserve">'
        : this.templaterState.matches[options.xmlTagNumber][1];

    if (!options.noEndTag) {
      after = '</' + this.tagXml + '>';
    }
    this.currentCompiledTag.prependText(before);
    this.currentCompiledTag.appendText(after);
    return before + options.insideValue + after;
  },

// replace first occurence of search (can be regex) after *from* offset
  replaceFirstFrom : function (string, search, replace, from) {
    var substr = string.substr(from);
    var replaced = substr.replace(search, replace);
    return string.substr(0, from) + replaced;
  },

  replaceXmlTag : function (content, options) {
    this.templaterState.offset[options.xmlTagNumber] += options.insideValue.length - this.templaterState.matches[options.xmlTagNumber][2].length;
    options.spacePreserve = options.spacePreserve != null ? options.spacePreserve : true;
    options.noStartTag = options.noStartTag || false;
    options.noEndTag = options.noEndTag || false;
    var replacer = this.xmlToBeReplaced(options);
    // so that the templaterState.matches are still correct
    this.templaterState.matches[options.xmlTagNumber][2] = options.insideValue;
    // where the open tag starts: <w:t>
    var startTag = this.templaterState.calcXmlTagPosition(options.xmlTagNumber);
    // #calculate the replacer according to the params
    this.templaterState.moveCharacters(options.xmlTagNumber + 1, replacer.length, this.templaterState.matches[options.xmlTagNumber][0].length);
    if (content.indexOf(this.templaterState.matches[options.xmlTagNumber][0]) === -1) {
      var err = new Errors.XTInternalError("Match not found in content");
      err.properties.id = "xmltemplater_replaced_cant_be_same_as_substring";
      err.properties.expectedMatch = this.templaterState.matches[options.xmlTagNumber][0];
      err.properties.content = content;
      throw err;
    }
    content = this.replaceFirstFrom(content, this.templaterState.matches[options.xmlTagNumber][0], replacer, startTag);
    this.templaterState.matches[options.xmlTagNumber][0] = replacer;
    var preContent = content.substr(this.lastStart, startTag - this.lastStart);
    if (this.templaterState.loopType() === "simple") {
      this.compiled.appendText(preContent);
      this.lastStart = startTag + this.templaterState.matches[options.xmlTagNumber][0].length;
      this.compiled.appendTag(this.currentCompiledTag);
    }
    return content;
  },

  replaceTagByValue : function (newValue, content) {
    var options = {
        xmlTagNumber : this.templaterState.tagStart.numXmlTag,
        noStartTag   : this.templaterState.matches[this.templaterState.tagStart.numXmlTag].first != null,
        noEndTag     : this.templaterState.matches[this.templaterState.tagStart.numXmlTag].last != null
    };
    if (this.templaterState.tagEnd.numXmlTag === this.templaterState.tagStart.numXmlTag) {
        // <w>{aaaaa}</w>
        this.currentCompiledTag = new CompiledXmlTag([
            this.templaterState.getLeftValue(),
            {type : 'tag', tag : this.templaterState.textInsideTag},
            this.templaterState.getRightValue()
        ]);
        options.insideValue = this.templaterState.getLeftValue() + newValue + this.templaterState.getRightValue();
        return this.replaceXmlTag(content, options);
    } else if (this.templaterState.tagEnd.numXmlTag > this.templaterState.tagStart.numXmlTag) {
        //<w>{aaa</w> ... <w> aaa} </w>

        // 1. for the first (@templaterState.tagStart.numXmlTag): replace **{tag by **tagValue
        options.insideValue = newValue;
        this.currentCompiledTag = new CompiledXmlTag([{type : 'tag', tag : this.templaterState.textInsideTag}]);
        if ((this.templaterState.matches[this.templaterState.tagStart.numXmlTag].first == null) && (this.templaterState.matches[this.templaterState.tagStart.numXmlTag].last == null)) {
            this.currentCompiledTag = new CompiledXmlTag([
                this.templaterState.getLeftValue(),
                {type : 'tag', tag : this.templaterState.textInsideTag}
            ]);
            options.insideValue = this.templaterState.getLeftValue() + newValue;
        }
        content = this.replaceXmlTag(content, options);

        // 2. for in between (@templaterState.tagStart.numXmlTag+1...@templaterState.tagEnd.numXmlTag) replace whole by ''
        options = {
            insideValue   : '',
            spacePreserve : false
        };

        var i, k, ref, ref1;
        for (k = i = ref = this.templaterState.tagStart.numXmlTag + 1, ref1 = this.templaterState.tagEnd.numXmlTag; ref <= ref1 ? i < ref1 : i > ref1; k = ref <= ref1 ? ++i : --i) {
            options.xmlTagNumber = k;
            this.currentCompiledTag = new CompiledXmlTag([]);
            content = this.replaceXmlTag(content, options);
        }

        // 3. for the last (@templaterState.tagEnd.numXmlTag) replace ..}__ by ".."
        options = {
            insideValue   : this.templaterState.getRightValue(),
            spacePreserve : true,
            xmlTagNumber  : this.templaterState.tagEnd.numXmlTag,
            noEndTag      : this.templaterState.matches[this.templaterState.tagEnd.numXmlTag].last != null
        };
        this.currentCompiledTag = CompiledXmlTag['null']();
        return this.replaceXmlTag(content, options);
    }
  },

  replaceLoopTag : function () {
    // You DashLoop= take the outer scope only if you are in a table
    if (this.templaterState.loopType() === 'dash') {
      return this.dashLoop(this.templaterState.loopOpen.element);
    }
    if (this.intelligentTagging) {
      var dashElement = this.calcIntellegentlyDashElement();
      if (dashElement) {
        return this.dashLoop(dashElement, true);
      }
    }
    var outerLoop = new SubContent(this.content).getOuterLoop(this.templaterState);
    var innerTemplate = new SubContent(this.content).getInnerLoop(this.templaterState).text;
    return this.forLoop(outerLoop, innerTemplate);
  },

  calcSubXmlTemplater : function (innerTagsContent, argOptions) {
    var options = this.toJson();
    if (argOptions && argOptions.tags) {
      options.tags = argOptions.tags;
      options.scopeList = options.scopeList.concat(argOptions.tags);
      options.scopePath = options.scopePath.concat(this.templaterState.loopOpen.tag);
    }
    return (new this.currentClass(innerTagsContent, options)).render();
  },

  forLoop : function (outerTags, subTemplate) {
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
    var startTag = outerTags.start;
    var preContent = this.content.substr(this.lastStart, startTag - this.lastStart);
    this.compiled.appendText(preContent);
    this.lastStart = outerTags.end;
    var tag = this.templaterState.loopOpen.tag;
    var newContent = '';
    this.scopeManager.loopOver(tag, function (subTags) {
      var subfile = this.calcSubXmlTemplater(subTemplate, {tags : subTags});
      return newContent += subfile.content;
    }.bind(this), this.templaterState.loopIsInverted);
    var subfile = this.calcSubXmlTemplater(subTemplate, {tags : {}});
    this.compiled.appendSubTemplate(subfile.compiled.compiled, tag, this.templaterState.loopIsInverted);
    this.lastStart += newContent.length - outerTags.text.length;
    return this.replaceXml(outerTags, newContent);
  }
});

module.exports = XmlTemplater;