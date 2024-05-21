let serverAPIKey, serverPort, serverIp, serverProtocol, serverPath, origin, userId, version;


function pullStoredData(callback) {
    chrome.storage.sync.get(['serverAPIKey', 'serverIp', 'serverPort', 'serverProtocol', 'serverPath', 'userId', 'overseerrVersion'], function(data) {
        serverAPIKey = data.serverAPIKey || '';
        serverIp = data.serverIp || '172.0.0.1';
        serverPort = data.serverPort || 8001;
        serverProtocol = data.serverProtocol || 'http';
        serverPath = data.serverPath || '/'
        origin = `${serverProtocol}://${serverIp}:${serverPort}${serverPath}`;
        if (origin.endsWith('/')) {
            origin = origin.slice(0, origin.length - 1);
        }
        userId = data.userId || undefined;
        overseerrVersion = data.overseerrVersion || undefined;
        if (callback) callback(data);
    });
}

function isLoggedIn(callback) {
    getLoggedUser(function(userSuccess, userErrorMsg, userResponse) {
        getOverseerrVersion(function(versionSuccess, versionErrorMsg, versionResponse) {
            userId = userSuccess && versionSuccess ? userResponse.id : null;
            version = userSuccess && versionSuccess ? versionResponse.version : null;
            chrome.storage.sync.set({
                userId: userId,
                overseerrVersion: version
            });
            if (callback) callback(userSuccess && versionSuccess, userId);
        });
    });
}

function setOrigin(apiKey, ip, port, protocol, path, callback) {
    serverAPIKey = apiKey;
    serverIp = ip;
    serverPort = port;
    serverProtocol = protocol;
    serverPath = path;
    origin = `${serverProtocol}://${serverIp}:${serverPort}${serverPath}`;
    if (origin.endsWith('/')) {
        origin = origin.slice(0, origin.length - 1);
    }
    chrome.storage.sync.set({
        serverAPIKey: serverAPIKey,
        serverIp: serverIp,
        serverPort: serverPort,
        serverProtocol: serverProtocol,
        serverPath: serverPath
    }, function () {
        if (callback) callback();
    });
}


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

    else if (request.contentScriptQuery === 'checkJellyseerr') {
        console.log(`Checking if instance is Jellyseerr`);
        pullStoredData(function() {
            const options = {headers: {'X-Api-Key': serverAPIKey, 'Accept': 'application/json'}};
            fetch(`${origin}/api/v1/auth/me`, options)
                .then(response => response.json())
                .then(json => sendResponse(Object.keys(json).filter((key) => /jellyfin/.test(key)).length > 0))
                .catch(error => console.error(error));
        });
        return true;
    }

    else if (request.contentScriptQuery === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
        return true;
    }

    else if (request.contentScriptQuery === 'listenForUrlChange') {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (
                changeInfo.status === 'complete' &&
                tab.status === 'complete' &&
                tab.url &&
                tab.url.startsWith('https://www.senscritique.com')
            ) {
                chrome.tabs.sendMessage(tab.id, {
                    newUrl: tab.url
                });
            }
        });
    }
    return false;
});
