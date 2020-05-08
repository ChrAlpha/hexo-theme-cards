window.onload = () => {
    watchToc();
}

window.onresize = () => {
    watchToc();
}

function watchToc() {
    var offsetHei = getElementTop(document.body.querySelectorAll('.with-side')[0]),
        clientWid = document.documentElement.clientWidth,
        article = document.body.querySelectorAll('.with-side')[0],
        toc = document.body.querySelectorAll('.toc')[0];

    if (clientWid < main_width * 1.2) {
        toc.style.display = 'none';
        article.style.padding = '0';
        return;
    }

    if (clientWid < main_width + toc_width * 2) {
        article.style.padding = `0 calc(${clientWid}px / 6)`;
        toc.style.width = `calc(${clientWid}px / 6)`;
    } else {
        article.style.padding = `0 ${toc_width}px`;
        toc.style.width = `${toc_width}px`;
    }
    toc.style.height = `calc(100vh - ${offsetHei}px - 30px)`;
    toc.style.display = 'block';
}

function getElementTop(element) {
    var actualTop = element.offsetTop;
    var current = element.offsetParent;

    while (current !== null) {
        actualTop += current.offsetTop;
        current = current.offsetParent;
    }

    return actualTop;
}
