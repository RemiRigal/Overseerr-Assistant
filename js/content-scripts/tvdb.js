let overseerrContainer, imdbId, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = '#translations';
containerOptions.textClass = 'text-sm';
containerOptions.containerClass = 'oa-mb-2 oa-py-3';
containerOptions.badgeBackground = '#313131';

mediaType = document.location.pathname.startsWith('/movies') ? 'movie' : 'tv';
let tmdbMatch = ($("a[href*='themoviedb']", $('#series_basic_info')).attr( "href" ) || '').match(/(\d+)(?:\/|$).*/) || [];
let imdbMatch = ($("a[href*='/title/tt']", $('#series_basic_info')).attr( "href" ) || '').match(/\/title\/(tt\d+)(?:\/|$).*/) || [];

if(tmdbMatch.length > 0 || imdbMatch.length > 1) {
    initializeContainer();
    insertSpinner();

    pullStoredData(function() {
        if (!userId) {
            removeSpinner();
            insertNotLoggedInButton();
            return;
        }

        if(tmdbMatch.length > 0) {
            chrome.runtime.sendMessage({contentScriptQuery: 'queryMedia', tmdbId: tmdbMatch[0], mediaType: mediaType}, json => {
                if (json) {
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
        } else if (imdbMatch.length > 1) {
            imdbId = imdbMatch[1];
            console.log(`IMDb id: ${imdbId}`);

            
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
                    chrome.runtime.sendMessage({contentScriptQuery: 'queryMedia', tmdbId: firstResult.id, mediaType: mediaType}, json => {
                        mediaInfo = json;
                        tmdbId = json.id;
                        console.log(`TMDB id: ${tmdbId}`);
                        removeSpinner();
                        fillContainer(json.mediaInfo);
                    });
                });
            });
        }
    });
}


