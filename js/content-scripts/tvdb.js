let overseerrContainer, imdbId, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = '#translations';
containerOptions.containerClass = 'mb-2 py-3';
containerOptions.badgeBackground = '#313131';

mediaType = document.location.pathname.startsWith('/movies') ? 'movie' : 'tv';
let tmdbMatch = ($("a[href*='themoviedb']", $('#series_basic_info')).attr( "href" ) || '').match(/(\d+)(?:\/|$).*/) || [];
let imdbMatch = ($("a[href*='/title/tt']", $('#series_basic_info')).attr( "href" ) || '').match(/\/title\/(tt\d+)(?:\/|$).*/) || [];

if(tmdbMatch.length > 0 || imdbMatch.length > 1) {
    initializeContainer();
    insertSpinner();

    pullStoredData(function () {
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

            let title = $('#series_title').text();
            let yearText = $('#series_basic_info ul li:eq(2) span').text().replace(/\s/g, '').split(",")[1];
            let releaseYear = parseInt(yearText);

            chrome.runtime.sendMessage({contentScriptQuery: 'search', title: title}, json => {
                json.results = json.results
                    .filter((result) => result.mediaType === mediaType)
                    .filter((result) => {
                        let date = result.releaseDate || result.firstAirDate || null;
                        return date && parseInt(date.slice(0, 4)) === releaseYear;
                    });
                if (json.results.length === 0) {
                    removeSpinner();
                    insertStatusButton('Media not found', 0);
                    return;
                }
                const firstResult = json.results[0];
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
        }
    });
}


