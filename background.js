importScripts('js/storage.js');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.contentScriptQuery === 'queryMedia') {
        console.log(`Querying ${request.mediaType} '${request.tmdbId}'`);
        pullStoredData(function() {
            const options = {headers: {'X-Api-Key': serverAPIKey}};
            fetch(`${origin}/api/v1/${request.mediaType}/${encodeURIComponent(request.tmdbId)}`, options)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error))
        });
        return true;
    }

    else if (request.contentScriptQuery === 'requestMedia') {
        console.log(`Requesting media '${request.tmdbId}'`);
        pullStoredData(function() {
            const options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Api-Key': serverAPIKey},
                body: JSON.stringify({mediaType: 'movie', mediaId: request.tmdbId})
            };
            fetch(`${origin}/api/v1/request`, options)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error));
        });
        return true;
    }

    else if (request.contentScriptQuery === 'search') {
        console.log(`Searching movie '${request.title}'`);
        pullStoredData(function() {
            const options = {headers: {'X-Api-Key': serverAPIKey}};
            fetch(`${origin}/api/v1/search?query=${encodeURIComponent(request.title)}`, options)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error));
        });
        return true;
    }
});
