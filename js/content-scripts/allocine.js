let overseerrContainer, allocineId, tmdbId, mediaType;

containerOptions.anchorElement = 'div.bam-container';
containerOptions.textClass = 'text-sm';
containerOptions.containerClass = 'mt-2 py-2';
containerOptions.plexButtonClass = 'bg-gray-800';
containerOptions.requestCountBackground = '#032541';

mediaType = document.location.pathname.startsWith('/film') ? 'movie' : 'tv';

const allocineRegex = /\/(?:film|series)\/\w*=(\d+)(?:\w|-|.)*/;
let matches = document.location.pathname.match(allocineRegex);
if (matches !== null && matches.length > 1) {
    allocineId = parseInt(matches[1]);
    console.log(`Allocine id: ${allocineId}`);

    let title = $('div.titlebar-title.titlebar-title-lg').text();

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
                tmdbId = json.id;
                console.log(`TMDB id: ${tmdbId}`);
                removeSpinner();
                fillContainer(json.mediaInfo);
            });
        });
    });
}

