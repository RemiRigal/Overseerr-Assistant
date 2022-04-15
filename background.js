importScripts('js/storage.js');


function encodeURIComponentSafe(value) {
    return encodeURIComponent(value)
        .replace(/!/g, '%21')
        .replace(/\~/g, '%7E')
        .replace(/\*/g, '%2A')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');
}

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
        console.log(`Requesting media '${request.tmdbId}' of type '${request.mediaType}'`);
        pullStoredData(function() {
            const options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Api-Key': serverAPIKey},
                body: JSON.stringify({mediaType: request.mediaType, mediaId: request.tmdbId, seasons: request.seasons})
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
            fetch(`${origin}/api/v1/search?query=${encodeURIComponentSafe(request.title)}`, options)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error));
        });
        return true;
    }

    else if (request.contentScriptQuery === 'plexQueryMedia') {
        let mediaKey = encodeURIComponentSafe(request.mediaKey);
        let plexToken = encodeURIComponentSafe(request.plexToken);
        console.log(`Requesting Plex media '${mediaKey}'`);
        const options = {headers: {'Accept': 'application/json'}};
        fetch(`https://metadata.provider.plex.tv/library/metadata/${mediaKey}?X-Plex-Token=${plexToken}`, options)
            .then(response => response.json())
            .then(json => sendResponse(json))
            .catch(error => console.error(error));
        return true;
    }

    else if (request.contentScriptQuery === 'getOverseerrVersion') {
        console.log(`Getting Overseerr version`);
        pullStoredData(function() {
            const options = {headers: {'X-Api-Key': serverAPIKey}};
            fetch(`${origin}/api/v1/status`, options)
                .then(response => response.json())
                .then(json => sendResponse(json))
                .catch(error => console.error(error));
        });
        return true;
    }

    else if (request.contentScriptQuery === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
        return true;
    }
    return false;
});
