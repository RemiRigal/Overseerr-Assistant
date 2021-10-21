let overseerrContainer, imdbId, tmdbId;

// const anchorElement = 'ul.ipc-inline-list.ReviewContent__StyledInlineList-vlmc3o-0.hyrmRe';
const anchorElement = 'div.WatchlistButton__ButtonParent-sc-1fmni0g-0.hbeiyJ';
// ipc-split-button ipc-btn--theme-baseAlt ipc-split-button--ellide-false ipc-btn--type-secondary ipc-btn--on-textPrimary ipc-split-button--width-full WatchlistButton__ButtonParent-sc-1fmni0g-0 hbeiyJ
const textClass = 'text-sm';
const containerClass = 'mt-2 py-2';
const requestCountBackground = '#313131';

const imdbRegex = /\/title\/(tt\d+)(?:\/|$).*/;
let matches = document.location.pathname.match(imdbRegex);
if (matches !== null && matches.length > 1) {
    imdbId = matches[1];
    console.log(`IMDB id: ${imdbId}`);

    let title = $('h1.TitleHeader__TitleText-sc-1wu6n3d-0.dxSWFG').text();

    initializeContainer();
    insertSpinner();

    pullStoredData(function () {
        chrome.runtime.sendMessage({contentScriptQuery: 'search', title: title}, json => {
            console.log(json);
            if (json.results.length === 0) {
                removeSpinner();
                insertStatusButton('Not found', 0);
                return;
            }

            chrome.runtime.sendMessage({contentScriptQuery: 'queryMovie', tmdbId: json.results[0].id}, json => {
                console.log(json);

                if (imdbId === json.imdbId) {
                    tmdbId = json.id;
                    console.log(`TMDB id: ${tmdbId}`);
                    removeSpinner();
                    fillContainer(json.mediaInfo);
                } else {
                    removeSpinner();
                    insertStatusButton('Not found', 0);
                }
            });
        });
    });
}



