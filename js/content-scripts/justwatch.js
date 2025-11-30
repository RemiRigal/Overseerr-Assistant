let overseerrContainer, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = `div.title-sidebar > div > button.basic-button:first`;
containerOptions.textClass = 'oa-text-sm';
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
    waitForElm('label.search-icon').then(() => {
        waitForElm('div.title-sidebar').then(() => {
            waiting = false;
            titleElement = $('div.title-detail-hero').find('h1:first');
            if (titleElement === null) {
                return;
            }

            initializeContainer();
            insertSpinner();

            let titleWithDate = titleElement.text();
            let title = titleWithDate;

            let titleMatches = titleWithDate.match(/\s*(.*)\s+\(\d{4}\)\s*/);
            if (titleMatches !== null && titleMatches.length > 1) {
                title = titleMatches[1];
            }
            
            pullStoredData(function () {
                if (!userId) {
                    removeSpinner();
                    insertNotLoggedInButton();
                    return;
                }

                chrome.runtime.sendMessage({contentScriptQuery: 'search', title: title}, json => {
                    if (json.results.length === 0) {
                        removeSpinner();
                        insertStatusButton('Media not found', 0);
                        return;
                    }
                    const firstResult = json.results[0];
                    chrome.runtime.sendMessage({contentScriptQuery: 'queryMedia', tmdbId: firstResult.id, mediaType: firstResult.mediaType}, json => {
                        mediaInfo = json;
                        tmdbId = json.id;
                        console.log(`TMDB id: ${tmdbId}`);
                        removeSpinner();
                        fillContainer(json.mediaInfo);
                    });
                });
            });
        });
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
