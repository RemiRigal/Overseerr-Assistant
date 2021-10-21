let serverAPIKey, serverPort, serverIp, serverProtocol, origin, userId;


function pullStoredData(callback) {
    chrome.storage.sync.get(['serverAPIKey', 'serverIp', 'serverPort', 'serverProtocol', 'userId'], function(data) {
        serverAPIKey = data.serverAPIKey || '';
        serverIp = data.serverIp || '172.0.0.1';
        serverPort = data.serverPort || 8001;
        serverProtocol = data.serverProtocol || 'http';
        origin = `${serverProtocol}://${serverIp}:${serverPort}`;
        userId = data.userId || undefined;
        if (callback) callback(data);
    });
}

function isLoggedIn(callback) {
    getLoggedUser(function(success, errorMsg, response) {
        userId = success ? response.id : null;
        chrome.storage.sync.set({
            userId: userId
        });
        if (callback) callback(success, userId);
    });
}

function setOrigin(apiKey, ip, port, protocol, callback) {
    serverAPIKey = apiKey;
    serverIp = ip;
    serverPort = port;
    serverProtocol = protocol;
    origin = `${serverProtocol}://${serverIp}:${serverPort}`;
    chrome.storage.sync.set({
        serverAPIKey: serverAPIKey,
        serverIp: serverIp,
        serverPort: serverPort,
        serverProtocol: serverProtocol
    }, function () {
        if (callback) callback();
    });
}
