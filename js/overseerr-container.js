let containerOptions = {
    anchorElement: 'body',
    textClass: '',
    containerClass: '',
    plexButtonClass: 'bg-transparent',
    badgeBackground: '#313131'
};

const mediaStatus = {
    1: 'Unknown',
    2: 'Pending',
    3: 'Processing',
    4: 'Partially Available',
    5: 'Available'
}

function initializeContainer() {
    if (overseerrContainer) overseerrContainer.remove();
    overseerrContainer = $(`<div class="overseerr-container flex flex-row ${containerOptions.containerClass} items-center">
         <img id="overseerrStatus" class="overseerr-icon" src="${chrome.runtime.getURL('images/icon.png')}" alt="Overseerr icon">
       </div>
    `);
    let anchor = $(`${containerOptions.anchorElement}:first`);
    overseerrContainer.insertAfter(anchor);
}

function fillContainer(mediaInfo) {
    const status = mediaInfo ? mediaInfo.status : 0;
    const plexUrl = mediaInfo ? mediaInfo.plexUrl : '';
    const requestCount = status > 0 ? mediaInfo.requests.length : 0;
    let requestedByCurrentUser = false;
    if (requestCount > 0) {
        let requestsOfCurrentUser = mediaInfo.requests.filter((request) => request.requestedBy.id === userId);
        requestedByCurrentUser = requestsOfCurrentUser.length > 0;
    }

    switch (status) {
        case 0: // No media info
        case 1: // Unknown
            insertRequestButton();
            break;
        case 2: // Pending
        case 3: // Processing
            insertStatusButton(mediaStatus[status], requestCount);
            if (!requestedByCurrentUser) insertRequestButton();
            else insertRequestedButton();
            break;
        case 4: // Partially Available
            let availableSeasons = [];
            if (mediaInfo.mediaType === 'tv') {
                availableSeasons = mediaInfo.seasons
                    .filter((season) => season.status === 5)
                    .map((season) => season.seasonNumber);
            }
            insertStatusButton(mediaStatus[status], null, availableSeasons)
            insertPlexButton(plexUrl);
            break;
        case 5: // Available
            insertStatusButton(mediaStatus[status]);
            insertPlexButton(plexUrl);
            break;
    }
}

function insertSpinner() {
    overseerrContainer.append(`
        <div id="overseerrSpinner" class="overseerr-spin"></div>
    `);
}

function removeSpinner() {
    overseerrContainer.find('#overseerrSpinner').remove();
}

function insertRequestButton() {
    overseerrContainer.append(`
        <a id="overseerrRequest" class="relative inline-flex h-full ${containerOptions.textClass} items-center px-4 py-2 leading-5 font-medium z-10 hover:z-20 focus:z-20 focus:outline-none transition
            ease-in-out duration-150 button-md overseerr-text-white border bg-indigo-600 border-indigo-600 hover:bg-indigo-500 hover:border-indigo-500 active:bg-indigo-700
            active:border-indigo-700 focus:ring-blue rounded-md ml-2" href="#">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          <span>Request</span>
        </a>
    `);
    $('#overseerrRequest').on('click', function() {
        removeRequestButton();
        insertSpinner();
        let seasons = [];
        if (mediaType === 'tv' && mediaInfo.hasOwnProperty('seasons')) {
            seasons = mediaInfo.seasons
                .map((season) => season.seasonNumber)
                .filter((season) => season > 0);
        }
        chrome.runtime.sendMessage({
            contentScriptQuery: 'requestMedia',
            tmdbId: tmdbId,
            mediaType: mediaType,
            seasons: seasons
        }, json => {
            initializeContainer();
            if (!json.hasOwnProperty('media')) {
                insertStatusButton('Error');
                return;
            }
            if (!json.media.hasOwnProperty('requests')) {
                json.media.requests = [];
            }
            json.media.requests.push({requestedBy: {id: userId}});
            fillContainer(json.media);
        });
    });
}

function removeRequestButton() {
    overseerrContainer.find('#overseerrRequest').remove();
}

function insertRequestedButton() {
    overseerrContainer.append(`
        <div id="overseerrRequest" class="relative inline-flex h-full ${containerOptions.textClass} items-center px-4 py-2 leading-5 font-medium z-10 hover:z-20 focus:z-20 focus:outline-none transition
            ease-in-out duration-150 button-md overseerr-text-white border bg-indigo-600 border-indigo-600 rounded-md ml-2" href="${origin}/${mediaType}/${tmdbId}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 sm:w-4 sm:h-4">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
          <span>Requested</span>
        </div>
    `);
}

function insertStatusButton(statusText, requestCount, availableSeasons) {
    const hasBadge = requestCount > 0 || (availableSeasons && availableSeasons.length > 0);
    overseerrContainer.append(`
        <a class="flex group items-center px-4 py-2 ${containerOptions.textClass} leading-6 font-medium rounded${hasBadge ? '-l' : ''}-md overseerr-text-white focus:outline-none transition ease-in-out duration-150
            bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500" href="${origin}/${mediaType}/${tmdbId}" target="_blank">
          ${statusText}
        </a>
    `);
    if (hasBadge) {
        let text = '';
        if (requestCount > 0) {
            text = `${requestCount} request${requestCount > 1 ? 's' : ''}`;
        } else if (availableSeasons && availableSeasons.length > 0) {
            text = `Season${availableSeasons.length > 1 ? 's' : ''} ${availableSeasons.join('-')}`;
        }
        overseerrContainer.append(`
            <a class="flex group items-center px-4 py-2 ${containerOptions.textClass} leading-6 font-medium rounded-r-md overseerr-text-white focus:outline-none transition ease-in-out duration-150
                bg-gradient-to-br from-gray-800 to-gray-900 hover:from-indigo-500 hover:to-purple-500" style="background: ${containerOptions.badgeBackground}" href="${origin}/${mediaType}/${tmdbId}" target="_blank">
              ${text}
            </a>
        `);
    }
}

function insertPlexButton(plexUrl) {
    overseerrContainer.append(`
        <a class="relative inline-flex h-full ${containerOptions.textClass} ${containerOptions.plexButtonClass} items-center ml-4 px-4 py-2 leading-6 font-medium z-10 hover:z-20 focus:z-20
            focus:outline-none transition ease-in-out duration-150 button-md overseerr-text-white border border-gray-400 hover:border-gray-200 focus:border-gray-100 active:border-gray-100
            rounded-md undefined" href="${plexUrl}" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Play on Plex</span>
        </a>
    `);
}

function insertNotLoggedInButton() {
    overseerrContainer.append(`
        <button id="overseerrOptions" class="relative inline-flex h-full ${containerOptions.textClass} items-center ml-3 px-4 py-2 leading-6 font-medium z-10 hover:z-20 focus:z-20 focus:outline-none
            transition ease-in-out duration-150 button-md overseerr-text-white border bg-transparent border-gray-400 hover:border-gray-200 focus:border-gray-100 active:border-gray-100
            rounded-md undefined">
          <span>No login found for Overseerr, click here to login</span>
        </button>
    `);
    $('#overseerrOptions').on('click', function() {
        chrome.runtime.sendMessage({contentScriptQuery: 'openOptionsPage'});
    });
}
