'use strict';

hexo.theme.on('processAfter', () => {
    if (!hexo.theme.config.lazyload || !hexo.theme.config.lazyload.enable) {
        return;
    }
    if (hexo.theme.config.lazyload.onlypost) {
        hexo.extend.filter.register('after_post_render', require('./lib/process').processPost);
    } else {
        hexo.extend.filter.register('after_render:html',  require('./lib/process').processSite);
    }
});