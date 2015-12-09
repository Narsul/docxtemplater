var assign = require('lodash.assign');
var isNull = require('lodash.isnull');

var DocUtils = require('./docUtils');
var Errors = require('./errors');

var TemplaterState = function TemplaterState(moduleManager, delimiters) {
    this.moduleManager = moduleManager;
    this.delimiters = delimiters;
    this.moduleManager.templaterState = this;
};

assign(TemplaterState.prototype, {

    moveCharacters: function (numXmlTag, newTextLength, oldTextLength) {
        var i, k, ref, ref1;
        var results = [];
        for (k = i = ref = numXmlTag, ref1 = this.matches.length; ref <= ref1 ? i < ref1 : i > ref1; k = ref <= ref1 ? ++i : --i) {
            results.push(this.charactersAdded[k] += newTextLength - oldTextLength);
        }
        return results;
    },

    calcStartTag: function (tag) {
        return this.calcPosition(tag.start);
    },

    calcXmlTagPosition: function (xmlTagNumber) {
        return this.matches[xmlTagNumber].offset + this.charactersAdded[xmlTagNumber];
    },

    calcEndTag: function (tag) {
        return this.calcPosition(tag.end) + 1;
    },

    calcPosition: function (bracket) {
        return this.matches[bracket.numXmlTag].offset + this.matches[bracket.numXmlTag][1].length + this.charactersAdded[bracket.numXmlTag] + bracket.numCharacter;
    },

    innerContent: function (type) {
        return this.matches[this[type].numXmlTag][2];
    },

    initialize: function () {
        this.context = '';
        this.inForLoop = false;
        this.loopIsInverted = false;
        this.inTag = false;
        this.inDashLoop = false;
        this.rawXmlTag = false;
        this.textInsideTag = '';
        this.trail = '';
        this.trailSteps = [];
        return this.offset = [];
    },

    startTag: function () {
        if (this.inTag === true) {
            var err = new Errors.XTTemplateError('Unclosed tag');
            var xtag = this.textInsideTag;
            err.properties = {
                xtag: xtag,
                id: 'unclosed_tag',
                context: this.context,
                explanation: 'The tag beginning with "' + (xtag.substr(10)) + '" is unclosed'
            };
            throw err;
        }
        this.currentStep = this.trailSteps[0];
        this.inTag = true;
        this.rawXmlTag = false;
        this.textInsideTag = '';
        this.tagStart = this.currentStep;
        return this.trail = '';
    },

    loopType: function () {
        if (this.inDashLoop) {
            return 'dash';
        }
        if (this.inForLoop) {
            return 'for';
        }
        if (this.rawXmlTag) {
            return 'xml';
        }
        var getFromModule = this.moduleManager.get('loopType');
        if (!isNull(getFromModule)) {
            return getFromModule;
        }
        return 'simple';
    },

    isLoopClosingTag: function () {
        return this.textInsideTag[0] === '/' && ('/' + this.loopOpen.tag === this.textInsideTag);
    },

    finishLoop: function () {
        this.context = '';
        this.rawXmlTag = false;
        this.inForLoop = false;
        this.loopIsInverted = false;
        this.loopOpen = null;
        this.loopClose = null;
        this.inDashLoop = false;
        this.inTag = false;
        return this.textInsideTag = '';
    },

    getLeftValue: function () {
        return this.innerContent('tagStart').substr(0, this.tagStart.numCharacter + this.offset[this.tagStart.numXmlTag]);
    },

    getRightValue: function () {
        return this.innerContent('tagEnd').substr(this.tagEnd.numCharacter + 1 + this.offset[this.tagEnd.numXmlTag]);
    },

    endTag: function () {
        if (this.inTag === false) {
            var err = new Errors.XTTemplateError('Unopened tag');
            err.properties = {
                id: 'unopened_tag',
                explanation: 'Unopened tag near : "' + (this.context.substr(this.context.length - 10, 10)) + '"',
                context: this.context
            };
            throw err;
        }
        this.inTag = false;
        this.tagEnd = this.currentStep;
        this.textInsideTag = this.textInsideTag.substr(0, this.textInsideTag.length + 1 - this.delimiters.end.length);
        this.textInsideTag = DocUtils.wordToUtf8(this.textInsideTag);
        this.fullTextTag = this.delimiters.start + this.textInsideTag + this.delimiters.end;
        if (this.loopType() === 'simple') {
            if (this.textInsideTag[0] === '@') {
                this.rawXmlTag = true;
                this.tag = this.textInsideTag.substr(1);
            }
            if (this.textInsideTag[0] === '#' || this.textInsideTag[0] === '^') {
                this.inForLoop = true;
                this.loopOpen = {
                    'start': this.tagStart,
                    'end': this.tagEnd,
                    'tag': this.textInsideTag.substr(1),
                    'raw': this.textInsideTag
                };
            }
            if (this.textInsideTag[0] === '^') {
                this.loopIsInverted = true;
            }
            if (this.textInsideTag[0] === '-' && this.loopType() === 'simple') {
                this.inDashLoop = true;
                var dashInnerRegex = /^-([^\s]+)\s(.+)$/;
                this.loopOpen = {
                    'start': this.tagStart,
                    'end': this.tagEnd,
                    'tag': this.textInsideTag.replace(dashInnerRegex, '$2'),
                    'element': this.textInsideTag.replace(dashInnerRegex, '$1'),
                    'raw': this.textInsideTag
                };
            }
        }
        if (this.textInsideTag[0] === '/') {
            return this.loopClose = {
                'start': this.tagStart,
                'end': this.tagEnd,
                'raw': this.textInsideTag
            };
        }
    }
});


module.exports = TemplaterState;
