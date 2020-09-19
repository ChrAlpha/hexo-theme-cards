'use strict';

hexo.on('generateBefore', () => {
    require('./lib/config')(hexo);
});
