importScripts('js/storage.js');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.contentScriptQuery === 'queryMovie') {
        console.log(`Querying movie ${request.tmdbId}`);
        pullStoredData(function() {
            fetch(`${origin}/api/v1/movie/${encodeURIComponent(request.tmdbId)}`)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error))
        });
        return true;
    }

    else if (request.contentScriptQuery === 'requestMovie') {
        console.log(`Requesting movie ${request.tmdbId}`);
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
});
