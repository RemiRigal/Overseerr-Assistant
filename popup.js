let statusDiv = document.getElementById('status');
let errorLabel = document.getElementById('error');
let successLabel = document.getElementById('success');
let pageDownloadDiv = document.getElementById('pageDownloadDiv');
let downloadButton = document.getElementById('download');
let downloadLabel = document.getElementById('downloadLabel');
let downloadDiv = document.getElementById('downloadDiv');
let optionsButton = document.getElementById('optionsButton');
let limitSpeedButton = document.getElementById('limitSpeedButton');
let externalLinkButton = document.getElementById('externalLinkButton');
let totalSpeedDiv = document.getElementById('totalSpeed');

let limitSpeedStatus = true;


function updateLimitSpeedStatus() {
    getLimitSpeedStatus(function(status) {
        limitSpeedStatus = status;
        limitSpeedButton.style.color = limitSpeedStatus ? "black" : "#007bff";
        limitSpeedButton.disabled = false;
    });
}

function updateStatusDownloads(loop) {
    getServerVersion(function(version) {
        console.log(version);
    });
    getStatusDownloads(function (status) {
        let html = '';
        let totalSpeed = 0;
        status.forEach(function(download) {
            totalSpeed += download.speed;
            html += `
                  <div style="margin-bottom: 12px; font-size: small">
                    <div class="d-flex">
                      <div class="ellipsis" style="padding-right: 24px">
                        ${download.name}
                      </div>
                      <div class="ml-auto">
                        ${download.format_eta.slice(0, 2)}h${download.format_eta.slice(3, 5)}m${download.format_eta.slice(6, 8)}
                      </div>
                    </div>
                    <div class="progress" style="margin: 2px 0 2px 0; height: 16px">
                      <div role="progressbar" class="progress-bar progress-bar-striped progress-bar-animated" 
                        aria-valuenow="${download.percent}" aria-valuemin="0" aria-valuemax="100"
                        style="width: ${download.percent}%;">
                        ${download.percent}%
                      </div>
                    </div>
                  </div>
                `;
        });
        if (!html) {
            html = `
              <div class="text-center m-4" style="margin-bottom: 12px; color: gray">
                No active downloads
              </div>
            `;
        }
        statusDiv.innerHTML = html;
        if (totalSpeed > 0) {
            totalSpeedDiv.innerHTML = `- ${(totalSpeed / (1000 * 1000)).toFixed(2)} MB/s`;
        } else {
            totalSpeedDiv.innerHTML = '';
        }
        if (loop) {
            setTimeout(updateStatusDownloads, 3000, true);
        }
    });
}

function setErrorMessage(message) {
    if (!message) {
        errorLabel.hidden = true;
        return;
    }
    errorLabel.innerText = message;
    errorLabel.hidden = false;
}

function setSuccessMessage(message) {
    if (!message) {
        successLabel.hidden = true;
        return;
    }
    successLabel.innerText = message;
    successLabel.hidden = false;
}

downloadButton.onclick = function(event) {
    // downloadButton.disabled = true;
    // chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    //     const url = tabs[0].url;
    //     const name = tabs[0].title;
    //     addPackage(name, url, function(success, errorMessage) {
    //         if (!success) {
    //             setErrorMessage(`Error downloading package: ${errorMessage}`);
    //             return;
    //         }
    //         downloadDiv.hidden = true;
    //         setSuccessMessage(`Download added`);
    //         updateStatusDownloads(false);
    //     });
    // });
};

optionsButton.onclick = function(event) {
    chrome.tabs.create({'url': '/options.html'});
}

limitSpeedButton.onclick = function(event) {
    // limitSpeedStatus = !limitSpeedStatus;
    // limitSpeedButton.disabled = true;
    // setLimitSpeedStatus(limitSpeedStatus, function(success) {
    //     updateLimitSpeedStatus();
    // });
}

pullStoredData(function() {


});






