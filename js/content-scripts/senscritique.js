let overseerrContainer, senscritiqueId, currentSenscritiqueUrl, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = 'div[data-testid="product-infos"]';
containerOptions.textClass = 'text-sm';
containerOptions.containerClass = 'oa-mt-2 oa-py-2';
containerOptions.plexButtonClass = 'oa-bg-gray-800';
containerOptions.badgeBackground = '#032541';

mediaType = document.location.pathname.startsWith('/film') ? 'movie' : 'tv';
const senscritiqueRegex = /\/(?:film|serie)\/\w*\/(\d+)/;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.newUrl && message.newUrl !== currentSenscritiqueUrl) {
        currentSenscritiqueUrl = message.newUrl;
        setTimeout(() => {
            checkForMedia(message.newUrl);
        }, 500);
    }
});

chrome.runtime.sendMessage({contentScriptQuery: 'listenForUrlChange'});

const checkForMedia = async (urlToCheck) => {
    let matches = urlToCheck.match(senscritiqueRegex);
    if (matches !== null && matches.length > 1) {
        mediaType = document.location.pathname.startsWith('/film') ? 'movie' : 'tv';

        const titleElement = document.querySelector('h1');
        let title = titleElement.textContent;
        let releaseYear = extractYear(document.querySelector('p[data-testid="creators"]').textContent);
        let displayedYear = parseInt(titleElement.nextElementSibling.querySelector('p:not([opacity])').textContent);

        initializeContainer();
        insertSpinner();

        pullStoredData(async function () {
            if (!userId) {
                removeSpinner();
                insertNotLoggedInButton();
                return;
            }

            try {
                let json = await sendMessageToBackground({contentScriptQuery: 'search', title: title});
                json.results = filterResults(json.results, releaseYear, displayedYear);
                if (json.results.length === 0) {
                    removeSpinner();
                    insertStatusButton('Media not found', 0);
                    return;
                }
                const firstResult = json.results[0];
                json = await sendMessageToBackground({contentScriptQuery: 'queryMedia', tmdbId: firstResult.id, mediaType: mediaType});
                mediaInfo = json;
                tmdbId = json.id;
                console.log(`TMDB id: ${tmdbId}`);
                removeSpinner();
                fillContainer(json.mediaInfo);
            } catch (error) {
                console.error(error);
            }
        });
    }
}

const extractYear = (creatorInformationsString) => {
    let parts = creatorInformationsString.split('·');
    if (parts.length >= 3) {
        let yearPart = parts[2].trim();
        let regex = /\b(\d{4})\b/;
        let match = yearPart.match(regex);
        if (match) {
            let year = match[1];
            return parseInt(year);
        }
    }
    return false;
}

const sendMessageToBackground = (message) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

const filterResults = (results, releaseYear, displayedYear) => {
    return results.filter((result) => {
        return result.mediaType === mediaType &&
            (!releaseYear || (result.releaseDate && [releaseYear, displayedYear].includes(parseInt(result.releaseDate.slice(0, 4)))));
    });
}