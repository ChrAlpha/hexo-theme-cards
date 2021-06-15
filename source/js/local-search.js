function searchEscape(keyword) {
    const htmlEntityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
    };

    return keyword.replace(/[&<>"'/]/g, function (i) {
        return htmlEntityMap[i];
    });
}

function regEscape(keyword) {
    const regEntityMap = {
        '{': '\\{',
        '}': '\\}',
        '[': '\\[',
        ']': '\\]',
        '(': '\\(',
        ')': '\\)',
        '?': '\\?',
        '*': '\\*',
        '.': '\\.',
        '+': '\\+',
        '^': '\\^',
        $: '\\$',
    };

    return keyword.replace(/[\{\}\[\]\(\)\?\*\.\+\^\$]/g, function (i) {
        return regEntityMap[i];
    });
}

function getParam(reqParam) {
    reqParam = reqParam.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const paraReg = new RegExp('[\\?&]' + reqParam + '=([^&#]*)');
    const results = paraReg.exec(window.location);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function setNotice(info) {
    const noticeSectionElement = document.getElementById('search-result__notice');
    noticeSectionElement.innerHTML = info;
}

function clearPosts() {
    const resultSectionElement = document.getElementById('search-result__list');
    resultSectionElement.innerHTML = '';
}

function createPosts(resArr) {
    const resultSectionElement = document.getElementById('search-result__list');
    let resultString = '';

    resArr.forEach((resInfo) => {
        const pageInfo = resInfo[0];
        const postTemplate = `
        <a href="${pageInfo.link}" class="search-result__link">
            <div class='search-result__item'>
                <strong>
                    ${pageInfo.title}
                </strong>
                <div class="search-result__content">
                    ${pageInfo.content}
                </div>
            </div>
        </a>
        `;

        resultString += postTemplate;
    });

    resultSectionElement.innerHTML = resultString;
}

function loadDataSearch(searchDataFile, skeys) {
    fetch(searchDataFile)
        .then((res) => {
            return res.json();
        })
        .then((datas) => {
            const startTime = performance.now();
            let resultArray = [];
            let resultCount = 0;
            let keywords = skeys.trim().toLowerCase().split(/\s/);

            datas.forEach((data) => {
                if (typeof data.title === 'undefined' || typeof data.content === 'undefined') {
                    return;
                }

                let matched = false;

                const dataTitle = data.title.trim().toLowerCase();
                const dataContent = data.content
                    ? data.content
                          .trim()
                          .replace(/<[^>]+>/g, '')
                          .toLowerCase()
                    : '';
                let dataWeight = 0;

                let indexs = {};
                indexs.title = -1;
                indexs.content = -1;
                indexs.firstOccur = -1;
                indexs.lastOccur = -1;

                if (dataTitle) {
                    keywords.forEach((keyword) => {
                        indexs.title = dataTitle.indexOf(keyword);
                        indexs.content = dataContent.indexOf(keyword);
                        if (indexs.title !== -1 || indexs.content !== -1) {
                            matched = true;
                            if (indexs.content !== -1) {
                                if (indexs.firstOccur > indexs.content || indexs.firstOccur === -1) {
                                    indexs.firstOccur = indexs.content;
                                }
                                if (indexs.lastOccur < indexs.content) {
                                    indexs.lastOccur = indexs.content;
                                }
                            }
                            dataWeight += indexs.title !== -1 ? 2 : 0;
                            dataWeight += indexs.content !== -1 ? 1 : 0;
                            resultCount++;
                        }
                    });
                }

                if (matched) {
                    let tPage = {};
                    tPage.title = data.title;
                    tPage.link = data.url;
                    keywords.forEach((keyword) => {
                        const regS = new RegExp(regEscape(keyword) + '(?!>)', 'gi');
                        tPage.title = tPage.title.replace(regS, '<m>$&</m>');
                    });
                    if (indexs.firstOccur >= 0) {
                        const halfLenth = 100;
                        let start = indexs.firstOccur - halfLenth;
                        let end = indexs.lastOccur + halfLenth;
                        if (start < 0) {
                            start = 0;
                        }
                        if (start === 0) {
                            end = halfLenth * 2;
                        }
                        if (end > dataContent.length) {
                            end = dataContent.length;
                        }
                        tPage.content = dataContent.substr(start, end - start);
                        keywords.forEach((keyword) => {
                            const regS = new RegExp(regEscape(keyword) + '(?!>)', 'gi');
                            tPage.content = tPage.content.replace(regS, '<m>$&</m>');
                        });
                    }
                    resultArray.push([tPage, dataWeight]);
                }
            });

            if (resultCount !== 0) {
                const finishTime = performance.now();
                setNotice(`${resultCount} related results found (in ${Math.round((finishTime - startTime) * 100) / 100} ms)`);
                resultArray.sort((a, b) => {
                    return b[1] - a[1];
                });
                createPosts(resultArray);
            } else {
                const finishTime = performance.now();
                setNotice(`No related result found (in ${Math.round((finishTime - startTime) * 100) / 100} ms)`);
                clearPosts();
            }
        });
}

function keySearch(skeys) {
    loadDataSearch(searchDataFile, searchEscape(skeys));
}

function inpSearch() {
    const skeys = document.getElementById('search-input').value;
    window.history.pushState({}, 0, window.location.href.split('?')[0] + '?s=' + skeys.replace(/\s/g, '+'));
    keySearch(skeys);
    return false;
}

(() => {
    const skeys = getParam('s');
    if (skeys !== '') {
        document.getElementById('search-input').value = skeys;
        keySearch(skeys);
    }
})();
