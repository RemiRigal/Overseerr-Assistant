let overseerrContainer, allocineId, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = 'div.bam-container';
containerOptions.textClass = 'text-sm';
containerOptions.containerClass = 'mt-2 py-2';
containerOptions.plexButtonClass = 'bg-gray-800';
containerOptions.badgeBackground = '#032541';

mediaType = document.location.pathname.startsWith('/film') ? 'movie' : 'tv';

const allocineRegex = /\/(?:film|series)\/\w*=(\d+)(?:\w|-|.)*/;
let matches = document.location.pathname.match(allocineRegex);
if (matches !== null && matches.length > 1) {
    allocineId = parseInt(matches[1]);
    console.log(`Allocine id: ${allocineId}`);

    let title = $('div.titlebar-title.titlebar-title-lg').text();

    let releaseYear = null;
    if (mediaType === 'movie') {
        let releaseDate = $('a.xXx.date.blue-link').text();
        let dateMatches = releaseDate.match(/\s*\d+\s\w+\s(\d{4})\s*/);
        if (dateMatches !== null && dateMatches.length > 1) {
            releaseYear = parseInt(dateMatches[1]);
        }
    }

    initializeContainer();
    insertSpinner();

    pullStoredData(function () {
        if (!userId) {
            removeSpinner();
            insertNotLoggedInButton();
            return;
        }

        chrome.runtime.sendMessage({contentScriptQuery: 'search', title: title}, json => {
            json.results = json.results.filter((result) => result.mediaType === mediaType);
            if (mediaType === 'movie' && releaseYear) {
                json.results = json.results.filter((result) => result.releaseDate && parseInt(result.releaseDate.slice(0, 4)) === releaseYear);
            }
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

