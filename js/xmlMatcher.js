var assign = require('lodash.assign');
var map = require('lodash.map');

var DocUtils = require('./docUtils');

// This class responsibility is to parse the XML.
var XmlMatcher = function XmlMatcher(content) {
    this.content = content;
};

assign(XmlMatcher.prototype, {

    parse: function (tagXml) {
        this.tagXml = tagXml;
        this.matches = DocUtils.pregMatchAll('(<' + this.tagXml + '[^>]*>)([^<>]*)</' + this.tagXml + '>', this.content);
        this.charactersAdded = map(this.matches, function () {
            return 0;
        });
        this.handleRecursiveCase();
        return this;
    },

    handleRecursiveCase: function () {
        /*
         Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
         For example with this string 'I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping',
         - we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift) (in this case 'I am')
         - we need to match the string that is at the right of a <w:t> (that's the role of replacerPush) (in this case 'sleeping')
         the test: describe 'scope calculation' it 'should compute the scope between 2 <w:t>' makes sure that this part of code works
         It should even work if they is no XML at all, for example if the code is just 'I am sleeping', in this case however, they should only be one match
         */
        var replacerUnshift = function () {
            var match = arguments[0];
            var pn = [].slice.call(arguments, 1, arguments.length - 2);
            var offset = arguments[arguments.length - 2];

            match = pn[0] + pn[1];
            // add match so that pn[0] = whole match, pn[1]= first parenthesis,...
            pn.unshift(match);
            pn.offset = offset;
            pn.first = true;
            // add at the beginning
            this.matches.unshift(pn);
            return this.charactersAdded.unshift(0);
        }.bind(this);

        if (this.content.indexOf('<') === -1 && this.content.indexOf('>') === -1) {
            this.content.replace(/^()([^<>]*)$/, replacerUnshift);
        }
        var regex = '^()([^<]+)<\/' + this.tagXml + '>';
        this.content.replace(new RegExp(regex), replacerUnshift);

        var replacerPush = function (match) {
            var match = arguments[0];
            var pn = [].slice.call(arguments, 1, arguments.length - 2);
            var offset = arguments[arguments.length - 2];

            pn.unshift(match);
            pn.offset = offset;
            pn.last = true;
            this.matches.push(pn);
            return this.charactersAdded.push(0);
        }.bind(this);
        regex = '(<' + this.tagXml + '[^>]*>)([^>]+)$';
        this.content.replace(new RegExp(regex), replacerPush);
        return this;
    }
});

module.exports = XmlMatcher;