'use strict';

hexo.extend.tag.register('note', (args, content) => {
    const type = args.shift();
    const text = hexo.render.renderSync({text: content, engine: 'markdown'});
    var header = '', 
        result = '';

    if (args.length) {
        header += `<div class="blockquote-note__header">${args.join(' ')}</div>`;
    }

    result += `<blockquote class="blockquote-note blockquote-note__${type}">${header}<div class="blockquote-note__content">`;
    result += text;
    result += '</div></blockquote>';

    return result;
}, {ends: true});