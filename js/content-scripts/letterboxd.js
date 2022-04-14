let overseerrContainer, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = `div.review.body-text`;
containerOptions.containerClass = 'py-2';
containerOptions.plexButtonClass = 'bg-gray-800';
containerOptions.badgeBackground = '#283038';

mediaType = 'movie';

tmdbButton = $('a[data-track-action=TMDb]:first');
tmdbURL = tmdbButton.attr('href');

const tmdbRegex = /.*\/movie\/(\d+)(?:\w|-)*/;
let matches = tmdbURL.match(tmdbRegex);
if (matches !== null && matches.length > 1) {
    tmdbId = parseInt(matches[1]);
    console.log(`TMDB id: ${tmdbId}`);

    initializeContainer();
    insertSpinner();

    pullStoredData(function() {
        if (!userId) {
            removeSpinner();
            insertNotLoggedInButton();
            return;
        }
        chrome.runtime.sendMessage({contentScriptQuery: 'queryMedia', tmdbId: tmdbId, mediaType: mediaType}, json => {
            mediaInfo = json;
            removeSpinner();
            fillContainer(json.mediaInfo);
        });
    });
}

