let xhr, xhrVersion = null;

function getLoggedUser(callback) {
    xhr = new XMLHttpRequest();
    xhr.open('GET', `${origin}/api/v1/auth/me`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Api-Key', serverAPIKey);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.hasOwnProperty('error')) {
                    if (callback) callback(false, response.error);
                } else {
                    if (callback) callback(true, null, response);
                }
            } catch {
                if (callback) callback(false, 'Server unreachable');
            }
            xhr = null;
        }
    }
    xhr.timeout = 5000;
    xhr.ontimeout = function() {
        if (callback) callback(false, 'Server unreachable');
    }
    xhr.send();
}

function getOverseerrVersion(callback) {
    xhrVersion = new XMLHttpRequest();
    xhrVersion.open('GET', `${origin}/api/v1/status`, true);
    xhrVersion.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhrVersion.setRequestHeader('X-Api-Key', serverAPIKey);
    xhrVersion.onreadystatechange = function() {
        if (xhrVersion.readyState === 4) {
            try {
                const response = JSON.parse(xhrVersion.responseText);
                if (response.hasOwnProperty('error')) {
                    if (callback) callback(false, response.error);
                } else {
                    if (callback) callback(true, null, response);
                }
            } catch {
                if (callback) callback(false, 'Server unreachable');
            }
            xhrVersion = null;
        }
    }
    xhrVersion.timeout = 5000;
    xhrVersion.ontimeout = function() {
        if (callback) callback(false, 'Server unreachable');
    }
    xhrVersion.send();
}
