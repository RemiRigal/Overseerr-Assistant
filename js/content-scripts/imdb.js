let overseerrContainer, imdbId, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = `div.sc-ddcc29cf-5`;
containerOptions.textClass = 'text-sm';
containerOptions.containerClass = 'mt-2 py-2';
containerOptions.badgeBackground = '#313131';

const imdbRegex = /\/title\/(tt\d+)(?:\/|$).*/;
let matches = ($("a[data-testid='hero-title-block__series-link']").attr( "href" ) || document.location.pathname).match(imdbRegex);
if (matches !== null && matches.length > 1) {
    imdbId = matches[1];
    console.log(`IMDb id: ${imdbId}`);

    let title = $("h1[data-testid='hero-title-block__series-link']").text() || $('h1:first').text();
    if (!title) {
        title = $("div[data-testid='hero-title-block__original-title']").text();
        title = title ? title.slice(title.indexOf(':') + 2, title.length) : title;
    }
    let releaseYear = parseInt($("ul[data-testid='hero-title-block__metadata'] li a[href*='/releaseinfo']").text().split("-")[0]) || null;
    console.log(title, releaseYear)

    initializeContainer();
    insertSpinner();

    pullStoredData(function () {
        if (!userId) {
            removeSpinner();
            insertNotLoggedInButton();
            return;
        }

        chrome.runtime.sendMessage({contentScriptQuery: 'search', title: title}, json => {
            json.results = json.results
                .filter((result) => result.mediaType === 'movie' || result.mediaType === 'tv')
                .filter((result) => {
                    if(!releaseYear) {
                        return true;
                    }
                    let date = result.releaseDate || result.firstAirDate || null;
                    return date && parseInt(date.slice(0, 4)) === releaseYear;
                });
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
}



