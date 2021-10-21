let usernameInput = document.getElementById('username');
let passwordInput = document.getElementById('password');
let serverAPIKeyInput = document.getElementById('serverAPIKey');
let serverIpInput = document.getElementById('serverIp');
let serverPortInput = document.getElementById('serverPort');
let useHTTPSInput = document.getElementById('useHTTPS');
let spinnerDiv = document.getElementById('spinnerDiv');
let loginStatusOKDiv = document.getElementById('loginStatusOK');
let loginStatusKODiv = document.getElementById('loginStatusKO');

let saveButton = document.getElementById('saveButton');
let alertDanger = document.getElementById('alertDanger');


function enableSpinner() {
    spinnerDiv.innerHTML = `
        <div class="spinner-border text-primary m-3"></div>
        <div class="text-white">Checking status...</div>
    `;
}

function disableSpinner() {
    spinnerDiv.innerHTML = ``;
}

function setDangerMessage(message, timeout=3000) {
    if (!message) {
        alertDanger.hidden = true;
        return;
    }
    alertDanger.innerText = message;
    alertDanger.hidden = false;
    if (timeout > 0) {
        setTimeout(function() {
            alertDanger.hidden = true;
            alertDanger.innerText = '';
        }, timeout);
    }
}

function getProtocol() {
    return useHTTPSInput.checked ? 'https' : 'http';
}

function updateLoggedInStatus(callback) {
    saveButton.disabled = true;
    loginStatusOKDiv.hidden = true;
    loginStatusKODiv.hidden = true;
    enableSpinner();
    isLoggedIn(function(loggedIn) {
        disableSpinner();
        loginStatusOKDiv.hidden = !loggedIn;
        loginStatusKODiv.hidden = loggedIn;
        saveButton.disabled = false;
        if (callback) callback();
    });
}

function requestPermission(callback) {
    chrome.permissions.contains({
        origins: [`${origin}/`]
    }, function(result) {
        if (!result) {
            chrome.permissions.request({
                origins: [`${origin}/`]
            }, function(granted) {
                if (callback) {
                    if (!granted) {
                        alert('Not granting this permission will make the extension unusable.');
                    }
                    callback(granted);
                }
            });
        } else if (callback) {
            callback(true);
        }
    });
}

function validateForm() {
    // Host
    const value = serverIpInput.value;
    const isValidIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
    const isValidName = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i.test(value);
    const isLocalhost = (value === 'localhost');
    const isServerIPValid = isValidIP || isValidName || isLocalhost;
    if (isServerIPValid) {
        serverIpInput.classList.remove('is-invalid');
    } else {
        serverIpInput.classList.add('is-invalid');
        saveButton.disabled = true;
    }
    // API key
    const isValidAPIKey = /\w{60,70}/.test(serverAPIKeyInput.value);
    if (isValidAPIKey) {
        serverAPIKeyInput.classList.remove('is-invalid');
    } else {
        serverAPIKeyInput.classList.add('is-invalid');
        saveButton.disabled = true;
    }
}

function requireSaving() {
    if (xhr !== null) {
        xhr.abort();
    }
    if (serverIpInput.value === serverIp &&
        parseInt(serverPortInput.value) === parseInt(serverPort) &&
        useHTTPSInput.checked === (serverProtocol === 'https') &&
        serverAPIKeyInput.value === serverAPIKey) {
        updateLoggedInStatus();
    } else {
        saveButton.disabled = false;
        loginStatusOKDiv.hidden = true;
        loginStatusKODiv.hidden = true;
    }
    validateForm();
}

saveButton.onclick = function(ev) {
    setOrigin(serverAPIKeyInput.value, serverIpInput.value, serverPortInput.value, getProtocol(), function() {
        requestPermission(function(granted) {
            updateLoggedInStatus();
        });
    });
};

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();
});

pullStoredData(function() {
    serverAPIKeyInput.value = serverAPIKey;
    serverIpInput.value = serverIp;
    serverPortInput.value = serverPort;
    useHTTPSInput.checked = serverProtocol === 'https';

    serverAPIKeyInput.oninput = requireSaving;
    serverIpInput.oninput = requireSaving;
    serverPortInput.oninput = requireSaving;
    useHTTPSInput.oninput = requireSaving;

    updateLoggedInStatus();
});
