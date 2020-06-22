// set up variables for base url, api key, and file paths to resources
// set variables for search params as filters

const BASE = 'https://api.harvardartmuseums.org';
const API = 'apikey=3322dbc0-af6d-11ea-ad43-f12230ae742f';
const PATHS = {
    CENTURY: 'century',
    CLASS: 'classification',
    OBJECT: 'object',
};
const PARAMS = {
    FILTERS: {
        TEMPORAL: `size=100&sort=temporalorder`,
        NAME: `size=100&sort=name`,
        SIZE: `size=20`,
    },
};

// use some destructing to flatten the code on global variables
// create direct access to objects deeper in the data 

const { TEMPORAL, NAME, SIZE } = PARAMS.FILTERS
const { CENTURY, CLASS, OBJECT } = PATHS


// SAVE THIS CODE FOR POSSIBLE REFACTOR

// async function fetchObjects() {
//     const url = `${BASE}/${PATH.OBJECT}?${KEY}`;
//     try {
//         const response = await fetch(url);
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error(error);
//     }
// }
// fetchObjects().then((x) => console.log(x));


// fetch: call api and fetch a list centuries to be used later
// response: conver to json and store/retrieve from local storage to limit api calls
// data: return a list records as centuries

async function fetchAllCenturies() {
    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
    }
    const url = `${BASE}/${CENTURY}?${API}&${TEMPORAL}`;
    try {
        const response = await fetch(url);
        const { records } = await response.json();
        localStorage.setItem('centuries', JSON.stringify(records));
        return records;
    } catch (error) {
        console.error(error.message);
    }
}


// fetch: call api and fetch a list classifications to be used later
// response: convert to json and store/retrieve from local storage to limit api calls
// data: return a list records as classifications

async function fetchAllClassifications() {
    if (localStorage.getItem('classifications')) {
        return JSON.parse(localStorage.getItem('classifications'));
    }
    const url = `${BASE}/${CLASS}?${API}&${NAME}`;
    try {
        const response = await fetch(url);
        const { records } = await response.json();
        localStorage.setItem('classificaitons', JSON.stringify(records));
        return records;
    } catch (error) {
        console.error(error.message);
    }
}


// goal: build the select menus for classifications and centuries
// input: fetch all promises by passing fetchAllClassifications() & fetchAllCenturies() into the array
// input: set up variables with destructuring to access returned data for classifications & centuries
// output: loop thru classifications as classification and create the option element, append to dom
// output: loop thru centuries as century and create the option element, append to dom
// output: populate the 'count' for each of the select menues

async function prefetchCategoryLists() {
    try { 
        const [classifications, centuries] = await Promise.all([
            fetchAllClassifications(),
            fetchAllCenturies(),
        ]);
        $('.classification-count').text( `(${classifications.length})` );
        classifications.forEach(classification => {
            classEl = $(`<option value="${classification.name}">${classification.name}</option>`)
            $('#select-classification').append(classEl);
        });

        $('.century-count').text( `(${ centuries.length })` );
        centuries.forEach(century => {
            centuryEl = $(`<option value="${century.name}">${century.name}</option>`)
            $('#select-century').append(centuryEl);
        });
    } catch (error) {
        console.error(error);
    }
}
prefetchCategoryLists();


// goal: build the search string to be execute when user clicks search
// input: capture user input from classification & century select menus and keywords input
// input: create variable 'terms' and set iup as an object
// runs: map object entries and join them to create a 'query' variable
// runs: set 'search' variable as a url for the search, sanitize 'query' with encode URI
// output: returns a URL representing the search string based on user input

function buildSearchString() {
    terms = {
        classification: $('#select-classification').val(),
        century: $('#select-century').val(),
        keyword: $('#keywords').val(),
    }
    const QUERY = Object.entries(terms).map( function (term) {
        return term.join("=");
    }).join("&");
    const search = `${BASE}/${OBJECT}?${API}&${encodeURI(QUERY)}&${SIZE}`;
    return search;
}

// goal: show loading icon when the user searchs
// input: addClass 'active' to show the loading icon
// output: displays loading icon during load


function onFetchStart() {
    $('#loading').addClass('active');
}


// goal: hide loading icon when the user search is complete
// input: aremoveClass 'active' to hide the loading icon
// output: hides loading icon after load

function onFetchEnd() {
    setTimeout(function(){
        $('#loading').removeClass('active');    
    }, 500);
}


// goal: get search results based on user input and display them in the DOM
// input: user enter search terms and click the 'search' button 
// runs: prevent page reload, show loading icon and get the search results
// fetch: set variable 'response' based call api with buildSearchSt() function
// response: convert to json and destructure variables for 'records' and 'info'
// data: use returned data by calling updatePreview() passing params 'records' and 'info'
// output: the search results are display in the 'preview', load icon is hidden

$('#search').on('submit', async function (event) {
    event.preventDefault();
    onFetchStart();
    try {
        const response = await fetch(buildSearchString());
        const { records, info } = await response.json();
        updatePreview(records, info);
    } catch (error) {
        console.error(error.message);
    }
    onFetchEnd();

});


// goal: render the HTML for the record 'preview'
// input: takes in parameter 'record' from updatePreview() function
// input: deconstruct 'record' for description, primaryimageurl, and title variables
// runs: build recordEl string and only show image if one is returned
// output: returns 'recordEl' and 'record' .data() is attached for later use.

function renderPreview(record) {
    const { description, primaryimageurl, title } = record;
    recordEl =  $(`
    <div class="object-preview">
        <a target="_blank" href="${primaryimageurl}">
            ${ primaryimageurl ? `<img src="${primaryimageurl}" />` : '' }
            ${ title ? `<h3>${title}</h3>` : '' }
        </a>
        ${ description ? `<h5>${description}</h5>` : '' }
    </div>
    `).data('record', record);
    return recordEl;
}


// goal: set up data for pagination and populate the DOM with the search results
// input: takes in params 'records' and 'info'
// runs: conditionally toggle the disabled attr and  set the 'next' and 'prev' URL
// output: loop through records as record and append them to 'results'  

function updatePreview(records, info) {
    const root = $('#preview');
    const results = root.find('.results').empty();
    // retrieves data from the .data() method invoked in renderPreview()
    info.next
        ? $('.next').data('url', info.next).attr('disabled', false)
        : $('.next').data('url', null).attr('disabled', true)
    info.prev
        ? $('.previous').data('url', info.prev).attr('disabled', false)
        : $('.previous').data('url', null).attr('disabled', true)
    records.forEach(function (record) {
        results.append(renderPreview(record));
    });
}


// goal: load the next or previous set of records in the preview pane
// input: executes what the user click the 'next' or 'previous' buttons
// fetch: get 'paginateUrl' from the click and await the 'response'
// response: convert to json and destructure variables for 'records' and 'info'
// data: use returned data by calling updatePreview() passing params 'records' and 'info'
// output: the preview pane updates with the appropriate set of records

$('#preview .next, #preview .previous').on('click', async function () {
   onFetchStart();
    try {
        const paginateUrl = $(this).data('url');
        const response = await fetch(paginateUrl);
        const { records, info } = await response.json(); 
        updatePreview(records, info);
    } catch {
        console.error(error.message)
    } finally { onFetchEnd(); }
  });


// goal: load the record into the 'feature' pane when link is clicked in the preview pane
// input: get the 'record' data based on the element that the user clicked
// output: update the DOM and load record details into feature pane with renderFeature()

$('#preview').on('click', '.object-preview', function (event) {
    event.preventDefault();
    const record = $(this).data('record');
    $('#feature').html(renderFeature(record));
});


// goal: render the HTML for the record 'feature'
// input: takes in parameter 'record' from 'preview' click event handler
// input: deconstruct the 'record' variables need to produce the 'feature'
// runs: buildsrecordEl string and only show image if one is returned
// output: returns 'recordEl' and 'record' .data() is attached for later use.

function renderFeature(record) {
    
    const {
        title,
        dated,
        images,
        primaryimageurl,
        description,
        culture,
        style,
        technique,
        medium,
        dimensions,
        people,
        department,
        division,
        contact,
        creditline,
    } = record

    return $(`
    <div class="object-feature">
        <header>
            <h3>${title}</h3>
            <h5>${dated} Dating</h5>
        </header>
        <section class="facts">
            ${factHTML('Culture', culture, 'culture')}
            ${factHTML('Style', style)}
            ${factHTML('Description', description)}
            ${factHTML('Technique', technique, 'technique')}
            ${factHTML('Medium', medium, 'medium')}
            ${factHTML('Dimensions', dimensions)}
            ${
            people
                ? people.map(function(person) {
                    return factHTML('Person', person.displayname, 'person');
                    }).join('')
                : ''
            }
            ${factHTML('Department', department)}
            ${factHTML('Division', division)}
            ${factHTML('Contact', `<a target="_blank" href="mailto:${contact}">${contact}</a>`) }
            ${factHTML('Creditline', creditline)}
        </section>
        <section class="photos">
            ${ photosHTML(images, primaryimageurl) }
        </section>
    </div>
    `);
  }


// goal: create a 'search' url to be used in the factHTML() function for each fact
// input takes in params as a key/value pair for searchType and searchStr
// output: returns a fully formed URL to be used for each fact

function searchURL(searchType, searchStr) {
    return `${BASE}/${OBJECT}?${API}&${searchType}=${searchStr}`;
}

// goal: build the HTML for each 'fact' and return conditionally if it has 'content'
// input: takes in title, content and searchTerm params from renderFact() function
// runs: conditionally add link by invokeing searhcURL() if searchTerm is not null
// output: returns the HTML for a fully formed 'fact' if 'content' is known

function factHTML(title, content, searchTerm = null) {
    if(!content) {
        return '';
    }
    return ` 
        <span class="title">${title}</span>
        <span class="content">
            ${ content && searchTerm ? `<a href="${searchURL(searchTerm, encodeURI(content))}">${content}</a>` : content }
        </span>
    `
}


// goal: populate the DOM conditionally if there are none, one, or many 'photos'
// input: takes in two params for images and primaryimageurl
// runs: if multiple images map a new array of all the images
// runs: in only one image load the primaryimageurl, else do nothing
// output: returns the HTML for the 'photos' based what is given in the data

function photosHTML(images, primaryimageurl) {
    if(images && images.length > 0) {
        return images.map(
            image => `<div class="image"><img src="${ image.baseimageurl }" /></div>`
        ).join('');
    } else if(primaryimageurl) {
        return `<div class="image"><img src="${ primaryimageurl }" /></div>`
    } else { 
        return '';
    }

}


// goal: load the new search results when the anchor click is link in 'facts'
// input: get the 'url' based on the element that the user clicked
// output: update the DOM and load 'record' details into preview pane with updatePreview()

$('#feature').on('click', 'a', async function (event) {  
    const hashURL = $(this).attr('href');
    console.log(hashURL);
    if(hashURL.startsWith('mailto:')) {
        return;
    }
    event.preventDefault();
    onFetchStart();
    try {
        const response = await fetch(hashURL);
        const {records, info} = await response.json();
        updatePreview(records,info);
    } catch {
        console.error(error.message);
    } finally {
        onFetchEnd();
    }
});















