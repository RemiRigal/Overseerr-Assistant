let overseerrContainer, tmdbId;

const anchorElement = 'ul.auto.actions';
const textClass = '';
const containerClass = 'py-2';
const requestCountBackground = '#032541';

const tmdbRegex = /\/movie\/(\d+)(?:\w|-)*/;
let matches = document.location.pathname.match(tmdbRegex);
if (matches !== null && matches.length > 1) {
    tmdbId = parseInt(matches[1]);
    console.log(`TMDB id: ${tmdbId}`);

    initializeContainer();
    insertSpinner();

    pullStoredData(function() {
        chrome.runtime.sendMessage({contentScriptQuery: 'queryMovie', tmdbId: tmdbId}, json => {
            removeSpinner();
            fillContainer(json.mediaInfo);
        });
    });
}

