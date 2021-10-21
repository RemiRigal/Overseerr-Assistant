importScripts('js/storage.js');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.contentScriptQuery === 'queryMedia') {
        console.log(`Querying ${request.mediaType} '${request.tmdbId}'`);
        pullStoredData(function() {
            fetch(`${origin}/api/v1/${request.mediaType}/${encodeURIComponent(request.tmdbId)}`)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error))
        });
        return true;
    }

    else if (request.contentScriptQuery === 'requestMedia') {
        console.log(`Requesting media '${request.tmdbId}'`);
        pullStoredData(function() {
           fetch(`${origin}/api/v1/request`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({mediaType: 'movie', mediaId: request.tmdbId})
            })
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error));
        });
        return true;
    }

    else if (request.contentScriptQuery === 'search') {
        console.log(`Searching movie '${request.title}'`);
        pullStoredData(function() {
            fetch(`${origin}/api/v1/search?query=${encodeURIComponent(request.title)}`)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error));
        });
        return true;
    }
});
