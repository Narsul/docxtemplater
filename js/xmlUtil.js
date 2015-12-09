var isNull = require('lodash.isnull');
var isUndefined = require('lodash.isundefined');
var reduce = require('lodash.reduce');

var DocUtils = require('./docUtils');

var XmlUtil = {
    getListXmlElements: function (text, start, end) {
        if (isNull(start) || isUndefined(start)) {
            start = 0;
        }
        if (isNull(end) || isUndefined(end)) {
            end = text.length - 1;
        }

        /*
         get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
         returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
         */
        var tags = DocUtils.pregMatchAll("<(\/?[^/> ]+)([^>]*)>", text.substr(start, end));
        return reduce(tags, function (result, tag) {
            if (tag[1][0] === '/') {
                // closing tag
                var justOpened = false;
                if (result.length) {
                    var lastTag = result[result.length - 1];
                    var innerLastTag = lastTag.tag.substr(1, lastTag.tag.length - 2);
                    var innerCurrentTag = tag[1].substr(1);
                    if (innerLastTag === innerCurrentTag) {
                        // tag was just opened
                        justOpened = true;
                    }
                }

                if (justOpened) {
                    result.pop();
                } else {
                    result.push({
                        tag: '<' + tag[1] + '>',
                        offset: tag.offset
                    });
                }
            } else if (tag[2][tag[2].length - 1] !== '/') {
                result.push({
                    tag: '<' + tag[1] + '>',
                    offset: tag.offset
                });
            }
            return result;
        }, []);
    }
};

module.exports = XmlUtil;
