let overseerrContainer, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = `div.review.body-text`;
containerOptions.containerClass = 'oa-py-5';
containerOptions.plexButtonClass = '';
containerOptions.badgeBackground = '#283038';

tmdbButton = $('a[data-track-action=TMDb]:first');
tmdbURL = tmdbButton.attr('href');

if (tmdbURL.includes('/movie/')) {
    mediaType = 'movie';
} else {
    mediaType = 'tv';
}

const tmdbRegex = new RegExp(`.*\/${mediaType}\/(\\d+)(?:\\w|-)*`);
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

