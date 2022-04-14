let overseerrContainer, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = 'div.PrePlayActionBar-container-US01pp';
containerOptions.containerClass = 'mb-3 py-2';
containerOptions.badgeBackground = '#00000099';

const titleElementSelector = 'div.PrePlayLeftTitle-leftTitle-ewTpwH';
const dateElementSelector = 'div.PrePlaySecondaryTitle-secondaryTitle-BA3QVn';


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

function processPage() {
    if (overseerrContainer) overseerrContainer.remove();

    waitForElm(titleElementSelector).then((titleElement) => {
        let title = titleElement.textContent;
        let releaseYear = parseInt($(dateElementSelector).text()) || null;
        console.log(title, releaseYear);

        initializeContainer();
        insertSpinner();
        arrangeMargins();

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
                    mediaInfo = json;
                    tmdbId = json.id;
                    console.log(`TMDB id: ${tmdbId}`);
                    removeSpinner();
                    fillContainer(json.mediaInfo);
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

