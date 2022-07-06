let containerOptions = {
    anchorElement: 'body',
    textClass: '',
    containerClass: '',
    plexButtonClass: 'oa-bg-transparent',
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
    overseerrContainer = $(`<div id="overseerr-assistant-container" class="overseerr-container oa-flex oa-flex-row ${containerOptions.containerClass} oa-items-center">
         <img id="overseerrStatus" class="overseerr-icon" src="${chrome.runtime.getURL('images/icon.png')}" alt="Overseerr icon">
       </div>
    `);
    let anchor = $(`${containerOptions.anchorElement}:first`);
    if (!anchor) {
        console.error('Anchor element not found for Overseerr container');
    }
    overseerrContainer.insertAfter(anchor);
}

function fillContainer(mediaInfo) {
    const status = mediaInfo ? mediaInfo.status : 0;
    const plexUrl = mediaInfo ? mediaInfo.plexUrl : origin;
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
        <a id="overseerrRequest" class="oa-relative oa-inline-flex oa-h-full ${containerOptions.textClass} oa-items-center oa-px-4 oa-py-2 oa-leading-5 oa-font-medium oa-z-10 hover:oa-z-20 focus:oa-z-20
            focus:oa-outline-none oa-transition ease-in-out duration-150 oa-button-md overseerr-text-white oa-border oa-bg-indigo-600 oa-border-indigo-600 hover:oa-bg-indigo-500 hover:oa-border-indigo-500 active:oa-bg-indigo-700
            active:oa-border-indigo-700 focus:ring-blue oa-rounded-md ml-2" href="javascript:;">
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
        <div id="overseerrRequest" class="relative inline-flex h-full ${containerOptions.textClass} oa-items-center oa-px-4 oa-py-2 oa-leading-5 oa-font-medium oa-z-10 hover:oa-z-20 focus:oa-z-20 focus:oa-outline-none
            oa-transition oa-ease-in-out oa-duration-150 oa-button-md overseerr-text-white oa-border oa-bg-indigo-600 oa-border-indigo-600 oa-rounded-md oa-ml-2" href="${origin}/${mediaType}/${tmdbId}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 sm:w-4 sm:h-4">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
          <span>Requested</span>
        </div>
    `);
}

function insertStatusButton(statusText, requestCount, availableSeasons) {
    const hasBadge = requestCount > 0 || (availableSeasons && availableSeasons.length > 0);
    const href = tmdbId ? `${origin}/${mediaType}/${tmdbId}` : origin;
    overseerrContainer.append(`
        <a class="oa-flex oa-h-full oa-group oa-items-center oa-px-4 oa-py-2 ${containerOptions.textClass} oa-leading-6 oa-font-medium oa-rounded${hasBadge ? '-l' : ''}-md overseerr-text-white
            focus:oa-outline-none oa-transition oa-ease-in-out oa-duration-150 oa-bg-gradient-to-br oa-from-indigo-600 oa-to-purple-600 hover:oa-from-indigo-500 hover:oa-to-purple-500" href="${href}" target="_blank">
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
            <a class="oa-flex group h-full oa-items-center oa-px-4 oa-py-2 ${containerOptions.textClass} oa-leading-6 oa-font-medium oa-rounded-r-md overseerr-text-white focus:oa-outline-none oa-transition oa-ease-in-out oa-duration-150
                oa-bg-gradient-to-br oa-from-gray-800 oa-to-gray-900 hover:oa-from-indigo-500 hover:oa-to-purple-500" style="background: ${containerOptions.badgeBackground}" href="${origin}/${mediaType}/${tmdbId}" target="_blank">
              ${text}
            </a>
        `);
    }
}

function insertPlexButton(plexUrl) {
    overseerrContainer.append(`
        <a class="oa-relative oa-inline-flex oa-h-full ${containerOptions.textClass} ${containerOptions.plexButtonClass} oa-items-center oa-ml-4 oa-px-4 oa-py-2 oa-leading-6 oa-font-medium oa-z-10 hover:oa-z-20 focus:oa-z-20
            focus:oa-outline-none oa-transition oa-ease-in-out duration-150 oa-button-md overseerr-text-white oa-border oa-border-gray-400 hover:oa-border-gray-200 focus:oa-border-gray-100 active:oa-border-gray-100
            oa-rounded-md undefined" href="${plexUrl}" target="_blank">
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
        <button id="overseerrOptions" class="oa-relative oa-inline-flex oa-h-full ${containerOptions.textClass} oa-items-center oa-ml-3 oa-px-4 oa-py-2 oa-leading-6 oa-font-medium oa-z-10 hover:oa-z-20 focus:oa-z-20 focus:oa-outline-none
            oa-transition oa-ease-in-out oa-duration-150 oa-button-md overseerr-text-white oa-border oa-bg-transparent oa-border-gray-400 hover:oa-border-gray-200 focus:oa-border-gray-100 active:oa-border-gray-100
            oa-rounded-md undefined">
          <span>Login to Overseerr</span>
        </button>
    `);
    $('#overseerrOptions').on('click', function() {
        chrome.runtime.sendMessage({contentScriptQuery: 'openOptionsPage'});
    });
}
