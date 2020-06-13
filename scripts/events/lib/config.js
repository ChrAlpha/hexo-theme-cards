'use strict';

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

function merge(target, source) {
    for (const key in source) {
        if (isObject(target[key]) && isObject(source[key])) {
            merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

module.exports = (hexo) => {
    var data = hexo.locals.get('data');
    
    if (data.cards) {
        merge(hexo.theme.config, data.cards);
    } else {
        merge(hexo.theme.config, hexo.config.theme_config)
    }
}