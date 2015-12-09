var assign = require('lodash.assign');

var Errors = require('./errors');

var SubContent = function SubContent(fullText) {
    this.fullText = fullText != null ? fullText : '';
    this.text = '';
    this.start = 0;
    this.end = 0;
};

assign(SubContent.prototype, {
    getInnerLoop: function (templaterState) {
        this.start = templaterState.calcEndTag(templaterState.loopOpen);
        this.end = templaterState.calcStartTag(templaterState.loopClose);
        return this.refreshText();
    },

    getOuterLoop: function (templaterState) {
        this.start = templaterState.calcStartTag(templaterState.loopOpen);
        this.end = templaterState.calcEndTag(templaterState.loopClose);
        return this.refreshText();
    },

    getInnerTag: function (templaterState) {
        this.start = templaterState.calcPosition(templaterState.tagStart);
        this.end = templaterState.calcPosition(templaterState.tagEnd) + 1;
        return this.refreshText();
    },

    refreshText: function () {
        this.text = this.fullText.substr(this.start, this.end - this.start);
        return this;
    },

    getErrorProps: function (xmlTag) {
        return {
            xmlTag: xmlTag,
            text: this.fullText,
            start: this.start,
            previousEnd: this.end
        };
    },

    getOuterXml: function (xmlTag) {
        var err;
        var endCandidate = this.fullText.indexOf('</' + xmlTag + '>', this.end);
        var startCandiate = Math.max(this.fullText.lastIndexOf('<' + xmlTag + '>', this.start), this.fullText.lastIndexOf('<' + xmlTag + ' ', this.start));
        if (endCandidate === -1) {
            err = new Errors.XTTemplateError('Can\'t find endTag');
            err.properties = this.getErrorProps(xmlTag);
            throw err;
        }
        if (startCandiate === -1) {
            err = new Errors.XTTemplateError('Can\'t find startTag');
            err.properties = this.getErrorProps(xmlTag);
            throw err;
        }
        this.end = endCandidate + ('</' + xmlTag + '>').length;
        this.start = startCandiate;
        return this.refreshText();
    },

    replace: function (newText) {
        this.fullText = this.fullText.substr(0, this.start) + newText + this.fullText.substr(this.end);
        this.end = this.start + newText.length;
        return this.refreshText();
    }
});

module.exports = SubContent;