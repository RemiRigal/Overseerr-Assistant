let overseerrContainer, imdbId, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = `div.title-sidebar > aside > div > button.basic-button:first`;
containerOptions.textClass = '';
containerOptions.containerClass = 'oa-mt-6 oa-mb-3 oa-py-3';
containerOptions.badgeBackground = '#313131';

let waiting = false;
let currentHref = document.location.href;


function processPage() {
    if (overseerrContainer) overseerrContainer.remove();

    if (waiting) {
        return;
    }

    waiting = true;
    waitForElm('div[v-uib-tooltip=IMDB]').then(() => {
        waiting = false;
        imdbButton = $('div[v-uib-tooltip=IMDB]:first > a');

        if (imdbButton === null && imdbButton.attr('href') === undefined) {
            return;
        }
        imdbURL = imdbButton.attr('href');

        const imdbRegex = /\/title\/(tt\d+)(?:\/|$).*/;
        let matches = imdbURL.match(imdbRegex);
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
    });
}

window.onload = function() {
    var bodyList = document.querySelector("body");

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (currentHref != document.location.href) {
                currentHref = document.location.href;
                processPage();
            }
        });
    });
    
    var config = {
        childList: true,
        subtree: true
    };
    
    observer.observe(bodyList, config);
};

processPage();
