function getServerStatus(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${origin}/api/v1/status`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Api-Key', serverAPIKey);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            try {
                const response = JSON.parse(xhr.responseText);
                console.log(response);
                if (response.hasOwnProperty('error')) {
                    if (callback) callback(false, response.error);
                } else {
                    if (callback) callback(true, null, response);
                }
            } catch {
                if (callback) callback(false, 'Server unreachable');
            }
        }
    }
    xhr.timeout = 5000;
    xhr.ontimeout = function() {
        if (callback) callback(false, 'Server unreachable');
    }
    xhr.send();
}

function search(query, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${origin}/api/v1/search?query=${encodeURIComponent(query)}`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Api-Key', serverAPIKey);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            if (callback) callback(response);
        }
    }
    xhr.send();
}

function getMovie(movieId, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${origin}/api/v1/movie/${movieId}`, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Api-Key', serverAPIKey);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            if (callback) callback(response);
        }
    }
    xhr.send();
}

