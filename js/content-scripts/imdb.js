let overseerrContainer, imdbId, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = 'div.WatchlistButton__ButtonParent-sc-1fmni0g-0.hbeiyJ';
containerOptions.textClass = 'text-sm';
containerOptions.containerClass = 'mt-2 py-2';
containerOptions.badgeBackground = '#313131';

const imdbRegex = /\/title\/(tt\d+)(?:\/|$).*/;
let matches = document.location.pathname.match(imdbRegex);
if (matches !== null && matches.length > 1) {
    imdbId = matches[1];
    console.log(`IMDb id: ${imdbId}`);

    let title = $('h1.TitleHeader__TitleText-sc-1wu6n3d-0.dxSWFG').text();

    initializeContainer();
    insertSpinner();

    pullStoredData(function () {
        if (!userId) {
            removeSpinner();
            insertNotLoggedInButton();
            return;
        }

        chrome.runtime.sendMessage({contentScriptQuery: 'search', title: title}, json => {
            if (json.results.length === 0) {
                removeSpinner();
                insertStatusButton('Not found', 0);
                return;
            }
            const firstResult = json.results[0];
            mediaType = firstResult.mediaType;
            chrome.runtime.sendMessage({contentScriptQuery: 'queryMedia', tmdbId: firstResult.id, mediaType: mediaType}, json => {
                if (imdbId === json.externalIds.imdbId) {
                    mediaInfo = json;
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



