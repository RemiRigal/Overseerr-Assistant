let serverAPIKey, serverPort, serverIp, serverProtocol, origin;


function pullStoredData(callback) {
    chrome.storage.sync.get(['serverAPIKey', 'serverIp', 'serverPort', 'serverProtocol'], function(data) {
        serverAPIKey = data.apiKey || '';
        serverIp = data.serverIp || '172.0.0.1';
        serverPort = data.serverPort || 8001;
        serverProtocol = data.serverProtocol || 'http';
        origin = `${serverProtocol}://${serverIp}:${serverPort}`;
        if (callback) callback(data);
    });
}

function isLoggedIn(callback) {
    getServerStatus(function(success) {
        if (callback) {
            if (success) callback(true);
            else callback(false);
        }
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
