let overseerrContainer, imdbId, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = '#translations';
containerOptions.containerClass = 'mb-2 py-2';
containerOptions.badgeBackground = '#313131';

const imdbRegex = /\/title\/(tt\d+)(?:\/|$).*/;

mediaType = document.location.pathname.startsWith('/movies') ? 'movie' : 'tv';
let matches = $("a[href*='/title/tt']", $('#series_basic_info')).attr( "href" ).match(imdbRegex);
// console.log(matches);
if (matches !== null && matches.length > 1) {
    imdbId = matches[1];
    console.log(`IMDb id: ${imdbId}`);

    let title = $('#series_title').text();
    // let releaseYear = parseInt($('a.TitleBlockMetaData__StyledTextLink-sc-12ein40-1.rgaOW:first').text());

    initializeContainer();
    insertSpinner();

    pullStoredData(function () {
        if (!userId) {
            removeSpinner();
            insertNotLoggedInButton();
            return;
        }

        chrome.runtime.sendMessage({contentScriptQuery: 'search', title: title}, json => {
            json.results = json.results
                .filter((result) => result.mediaType === mediaType)
                // .filter((result) => result.releaseDate && parseInt(result.releaseDate.slice(0, 4)) === releaseYear);
            if (json.results.length === 0) {
                removeSpinner();
                insertStatusButton('Media not found', 0);
                return;
            }
            const firstResult = json.results[0];
            mediaType = firstResult.mediaType;
            chrome.runtime.sendMessage({contentScriptQuery: 'queryMedia', tmdbId: firstResult.id, mediaType: mediaType}, json => {
                if (imdbId === json.externalIds.imdbId) {
                    mediaInfo = json;
                    tmdbId = json.id;
                    console.log(`TMDB id: ${tmdbId}`);
                    removeSpinner();
                    fillContainer(json.mediaInfo);
                } else {
                    removeSpinner();
                    insertStatusButton('Media not found', 0);
                }
            });
        });
    });
}



