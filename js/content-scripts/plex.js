let overseerrContainer, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = 'div.PrePlayActionBar-container-US01pp';
containerOptions.containerClass = 'mb-3 py-2';
containerOptions.badgeBackground = '#00000099';


function isHashValid(hash) {
    return hash.startsWith('#!/provider/');
}

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function arrangeMargins() {
    waitForElm('div.PrePlayActionBar-container-US01pp').then((elm) => {
        $(elm).css({'margin-bottom': '10px'});
    });
    waitForElm('div.PrePlayAvailabilityList-hub-lEPTuG').then((elm) => {
        $(elm).css({'margin-top': '20px'});
    });
}

function getPlexToken() {
    let imageElements = $('img').filter(function() {
        return $(this).attr('src').includes('X-Plex-Token');
    });
    if (imageElements.length > 0) {
        let pattern = /.X-Plex-Token=(\w+)/;
        let matches = imageElements.attr('src').match(pattern);
        if (matches !== null && matches.length > 1) {
            return matches[1];
        }
    }
    return null;
}

function getMediaKey() {
    let pattern = /key=%2Flibrary%2Fmetadata%2F(\w+)/;
    let matches = document.location.hash.match(pattern);
    if (matches !== null && matches.length > 1) {
        return matches[1];
    }
    return null;
}

function processPage() {
    if (overseerrContainer) overseerrContainer.remove();

    waitForElm('div.PrePlayLeftTitle-leftTitle-ewTpwH').then(() => {
        waitForElm('div.ImagePoster-flex-Ry0HC5 > img').then(() => {
            initializeContainer();
            insertSpinner();
            arrangeMargins();

            pullStoredData(function () {
                if (!userId) {
                    removeSpinner();
                    insertNotLoggedInButton();
                    return;
                }

                let plexToken = getPlexToken();
                let mediaKey = getMediaKey();

                if (plexToken === null || mediaKey === null) {
                    removeSpinner();
                    insertStatusButton('Media not found', 0);
                    return;
                }

                chrome.runtime.sendMessage({contentScriptQuery: 'plexQueryMedia', plexToken: plexToken, mediaKey: mediaKey}, json => {
                    let guids = json.MediaContainer.Metadata[0].Guid.filter(guid => guid.id.startsWith('tmdb'));
                    if (guids.length > 0) {
                        tmdbId = parseInt(guids[0].id.replace('tmdb://', ''));
                        mediaType = json.MediaContainer.Metadata[0].type === 'movie' ? 'movie' : 'tv';
                        console.log(`TMDB id: ${tmdbId}`);
                        chrome.runtime.sendMessage({contentScriptQuery: 'queryMedia', tmdbId: tmdbId, mediaType: mediaType}, json => {
                            mediaInfo = json;
                            console.log(json.name);
                            removeSpinner();
                            fillContainer(json.mediaInfo);
                        });
                    }
                });
            });
        });
    });
}

window.addEventListener('hashchange', function() {
    if (isHashValid(document.location.hash)) {
        processPage();
    }
});

if (isHashValid(document.location.hash)) {
    processPage();
}

