'use strict';

const fs = require('hexo-fs');

function noFollow(htmlContent)  {
    return htmlContent.replace(/<a(.*?)href="(.*?)"(.*?)>/gi, (str, p1, p2) => {
        // might be duplicate
        if(/data-srcset/gi.test(str)){
            return str;
        }
        if(/src="data:image(.*?)/gi.test(str)) {
            return str;
        }
        if(/do-follow/gi.test(str)) {
            return str;
        }
        return str.replace(p2, p2 + '\" rel=\"external nofollow noopener noreferrer');
    });
}

module.exports.processPost = function(data) {
    data.content = noFollow.call(this, data.content);
    return data;
};

module.exports.processSite = function (htmlContent) {
    return noFollow.call(this, htmlContent);
};