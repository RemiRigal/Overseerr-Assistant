let overseerrContainer, tmdbId, mediaType, mediaInfo;

containerOptions.anchorElement = '.movie-user-actions';
containerOptions.textClass = 'text-sm';
containerOptions.containerClass = 'oa-mt-3 oa-mb-2 oa-py-2';
containerOptions.plexButtonClass = 'oa-bg-gray-800';
containerOptions.badgeBackground = '#032541';

mediaType = document.querySelector('meta[property="og:type"]').content.includes('tv_show') ? 'tv' : 'movie';
const filmowTitle = document.querySelector('meta[property="og:title"]').content;
const titleElement = document.querySelector('h2.movie-original-title');
const title = titleElement ? titleElement.textContent.trim() : '';
const releaseYearElement = document.querySelector('small.release');
const displayedYear = releaseYearElement ? parseInt(releaseYearElement.textContent.trim()) : null;
let directorElement = document.querySelector('span[itemprop="director"]');
let director = directorElement ? directorElement.textContent.trim() : null;

let alternativeTitles = Array.from(document.querySelectorAll('.movie-other-titles ul li strong')).map(title => title.textContent.trim());
alternativeTitles.push(filmowTitle); // Add main title

let alternativeDates = Array.from(document.querySelectorAll('.release_date > div')).map(date => {
    let year = date.textContent.trim().match(/\d{4}/);
    return year ? parseInt(year[0]) : null;
}).filter(year => year !== null);

/**
 * Helper to search for media by title
 */
function searchForMedia(title) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ contentScriptQuery: 'search', title: title }, resolve);
    });
}

/**
 * Helper to query media details by TMDB ID
 */
function queryMedia(tmdbId, mediaType) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ contentScriptQuery: 'queryMedia', tmdbId: tmdbId, mediaType: mediaType }, resolve);
    });
}

/**
 * Async filter function
 */
const asyncFilter = async (arr, predicate) => {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
};

/**
 * Performs an exhaustive search using the original and alternative titles
 */
async function exhaustiveSearch(titles) {
    console.log('Searching for media:', titles);
    
    let searchResults = [];

    for (let i = 0; i < titles.length; i++) {
        let result = await searchForMedia(titles[i]);
        if (result && result.results && result.results.length > 0) {
            searchResults = [...searchResults, ...result.results];
        }
    }

    // remove duplicates by id
    searchResults = searchResults.filter((result, index, self) =>
        index === self.findIndex((t) => (
            t.id === result.id
        ))
    );

    return searchResults;
}

/**
 * Remove (Season X) or (Xª Temporada) from title, array or string
 */
function removeSeasonFromTitle(title) {
    const regex = /\((Season \d+|\d+ª Temporada)\)/gi;
    if (Array.isArray(title)) {
        console.log(title.map((t) => t.replace(regex, '').trim()));

        
        return title.map((t) => t.replace(regex, '').trim());
    }
    return title.replace(regex, '').trim();
}

/**
 * Filters search results by media type, release year, and director
 */
async function filterResultsByCriteria(results, mediaType, displayedYear, director) {
    // Filter by mediaType
    results = results.filter((result) => result.mediaType === mediaType);

    // Filter by releaseDate or firstAirDate
    results = results.filter((result) => {
        let releaseDate = result.releaseDate || result.firstAirDate;
        if (releaseDate) {
            let year = new Date(releaseDate).getFullYear();
            return year === displayedYear || alternativeDates.includes(year);
        }
        return true;
    });

    // Filter by director (if provided)
    if (director) {
        results = await asyncFilter(results, async (result) => {
            let mediaInfo = await queryMedia(result.id, mediaType);
            let directorFound = mediaInfo.credits.crew.filter((crew) => crew.name.toLowerCase() === director.toLowerCase());
            return directorFound.length > 0;
        });
    }

    return results;
}

/**
 * Filters search results by exact match of any title and release year
 */
async function filterResultsByExactMatch(results, titles, releaseYear) {
    // filter by mediaType
    results = results.filter((result) => result.mediaType === mediaType);

    // filter by name or originalName
    let titlesLowerCase = titles.map((title) => title.toLowerCase());
    results = results.filter((result) => {
        let name = result.name || result.title;
        let originalName = result.originalName || result.originalTitle;
        return titlesLowerCase.includes(name.toLowerCase()) || titlesLowerCase.includes(originalName.toLowerCase());
    });
    
    // filter by releaseDate
    results = results.filter((result) => {
        let releaseDate = result.releaseDate || result.firstAirDate;
        if (releaseDate) {
            let year = new Date(releaseDate).getFullYear();
            return year === releaseYear || alternativeDates.includes(year);
        }
    });

    return results;
}


/**
 * Main function to handle media search and filtering
 */
async function handleMediaSearch() {
    if (!title) {
        return;
    }

    initializeContainer();
    insertSpinner();

    pullStoredData(async function () {
        if (!userId) {
            removeSpinner();
            insertNotLoggedInButton();
            return;
        }

        // Perform exhaustive search with all alternative titles
        let titles = removeSeasonFromTitle([title, ...alternativeTitles]);
        let resultsSearch = await exhaustiveSearch(titles);

        console.log(`Search results for ${title}:`, resultsSearch);

        // If no results are found, show "Media not found"
        if (resultsSearch.length === 0) {
            removeSpinner();
            insertStatusButton('Media not found', 0, null, titles.pop());
            return;
        }

        // Filter results based on criteria (mediaType, releaseYear, director)
        results = await filterResultsByCriteria(resultsSearch, mediaType, displayedYear, director);
        // if no results are found, fallback to exact match of title and release year
        if (results.length === 0) {
            results = await filterResultsByExactMatch(resultsSearch, titles, displayedYear);
        }
        console.log('Filtered results:', results);

        if (results.length === 0) {
            removeSpinner();
            insertStatusButton('Media not found', 0, null, titles.pop());
            return;
        }

        const firstResult = results[0];
        mediaInfo = await queryMedia(firstResult.id, mediaType);
        tmdbId = mediaInfo.id;
        console.log(`TMDB ID: ${tmdbId}`);

        removeSpinner();
        fillContainer(mediaInfo.mediaInfo);
    });
}

// Trigger the search
handleMediaSearch();
