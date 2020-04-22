'use strict';

if (!hexo.config.nofollow || !hexo.config.nofollow.enable) {
    return;
}
if (hexo.config.nofollow.onlypost) {
    hexo.extend.filter.register('after_post_render', require('./lib/process').processPost);
} else {
    hexo.extend.filter.register('after_render:html',  require('./lib/process').processSite);
}