let overseerrContainer, imdbId, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = `div.sc-ddcc29cf-5`;
containerOptions.textClass = 'text-sm';
containerOptions.containerClass = 'mt-2 py-2';
containerOptions.badgeBackground = '#313131';

const imdbRegex = /\/title\/(tt\d+)(?:\/|$).*/;
let matches = document.location.pathname.match(imdbRegex);
if (matches !== null && matches.length > 1) {
    imdbId = matches[1];
    console.log(`IMDb id: ${imdbId}`);

    initializeContainer();
    insertSpinner();

    pullStoredData(function () {
        if (!userId) {
            removeSpinner();
            insertNotLoggedInButton();
            return;
        }
        chrome.runtime.sendMessage({contentScriptQuery: 'getOverseerrVersion'}, json => {
            if (!json.version || json.version.localeCompare("1.29.0", undefined, { numeric: true, sensitivity: 'base' }) < 0) {
                removeSpinner();
                insertStatusButton('Please update to Overseerr 1.29.0+', 0);
                return;
            }
            
            chrome.runtime.sendMessage({contentScriptQuery: 'search', title: `imdb:${imdbId}`}, json => {
                if (json.results.length === 0) {
                    removeSpinner();
                    insertStatusButton('Media not found', 0);
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
                        insertStatusButton('Media not found', 0);
                    }
                });
            });
        });
    });
}



