'use strict';

hexo.extend.tag.register('fold', (args, content) => {
    const config = hexo.theme.config.fold;

    const text = hexo.render.renderSync({ text: content, engine: 'markdown' });

    args = args.join(' ').split(',');

    let style, title;

    if (args.length > 1) {
        style = args[0].trim();
        title = args[1].trim();
    } else if (args.length > 0) {
        title = args[0].trim();
    }

    title = title ? title : config.summary;
    style = style ? style.indexOf('open') > -1 : false;

    if (!config || config.enable !== true) {
        return `<blockquote><p><strong>${title}</strong></p>${text}</blockquote>`;
    }

    if (config.motion === true) {
        return `<div class="sliding-fold ${style ? 'expanded' : 'collapsed'}"><summary>${title}</summary><div class="fold-content">${text}</div></div>`
    }

    return `<details ${style ? 'open' : ''}><summary>${title}</summary><div class="fold-content">${text}</div></details>`
}, { ends: true });
