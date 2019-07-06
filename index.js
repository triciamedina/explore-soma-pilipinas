'use strict';

const searchEventsURL = 'https://www.eventbriteapi.com/v3/venues/';

const options = {
    headers: new Headers ({
        'Authorization': 'Bearer CYLALJ2NCH7KAVFBMDQE',
    })
};

mapboxgl.accessToken = 'pk.eyJ1IjoidHJpY2lhbWVkaW5hIiwiYSI6ImNqdm9uOGYweDIwYTU0M29qbnQ4dnA1ZHEifQ.33vfmiE7P9ufCrkjUmNoxQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/triciamedina/cjw8micvr5so61cpi0wx38qnr?fresh=true',
    center: [-122.406, 37.780],
    zoom: 13.2,
    trackResize: true,
});

function setZoom() {
    if ($(window).width() >= 1200) {
        map.setZoom(14);
        map.setCenter([-122.409, 37.780]);
    } else {
        map.setZoom(13.2);
        map.setCenter([-122.406, 37.780]);
    }
}

function renderMap() {
    let zoom = new mapboxgl.NavigationControl({showCompass: false,});
    map.addControl(zoom, 'bottom-right');
    map.scrollZoom.disable();
    map.on('mouseenter', 'soma-pilipinas', function(e) {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'soma-pilipinas', function() {
        map.getCanvas().style.cursor = '';
    });
}


function handleMapHover() {
    // Creates popup instance without adding to the map
    let popup = new mapboxgl.Popup({
        offset: [0, -6],
        closeButton: false,
        closeOnClick: false
        });
    
    // Adds popup on hover
    map.on('mouseenter', 'soma-pilipinas', function(e) {
        map.getCanvas().style.cursor = 'pointer';
     
        let coordinates = e.features[0].geometry.coordinates.slice();
        let description = e.features[0].properties.TITLE;
        
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
     
        // Display popup and populate information
        popup.setLngLat(coordinates)
        .setHTML(`<h2>${description}</h2>`)
        .addTo(map);
    });
    
    // Removes popup when mouse leaves
    map.on('mouseleave', 'soma-pilipinas', function() {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });

}

function handleMapClick() {
    // Listens for click on point of interewst
    map.on('click', function(e) {
        let features = map.queryRenderedFeatures(e.point, {
            layers: ['soma-pilipinas'] 
        });
        if (!features.length) {
            return;
        }
        let feature = features[0];

        // Sets zoom and map center to clicked point
        map.flyTo({
            center: feature.geometry.coordinates,
            zoom: 14.6,
        })

        // Add popup and populate with information
        addPopup(feature);
    })
}

function addPopup(feature) {
    let popUps = $('.mapboxgl-popup');
    if (popUps[0]) popUps[0].remove();

    let popup = new mapboxgl.Popup({ 
        offset: [0, -6],
        closeButton: false,
        closeOnClick: true,
        })
        .setLngLat(feature.geometry.coordinates)
        .setHTML(
        `<h2>${feature.properties.TITLE}</h2>
        <button class="js-open-sidebar-button" type="button" role="button" aria-label="View details">View details</button>
        `)
        .addTo(map);
    
    // Open sidebar details on clicl
    openSideBar(feature);
    
    // Removes popup when a new filter is selected
    $('#filter').mousedown(function(){
        popup.remove();
    });
}

function openSideBar(feature) {
    // In mobile wait for button click to display sidebar
    if ($(window).width() < 1200) {
        $(".js-open-sidebar-button").click(function() {
           displaySidebarDetails(feature);
        });
    // In desktop open sidebar automatically
    } else {
        displaySidebarDetails(feature);
    };
}

function closeSideBar() {
    $('#sidebar').removeClass('sidebar-open');
        
    if ($(window).width() >= 1200) {
        $('.close-list').removeClass('desktop-hidden');
        map.flyTo({
            zoom: 14,
            center: [-122.409, 37.780],
        });
    } else {
        map.flyTo({
            zoom: 13.2,
            center: [-122.406, 37.780],
        });
    };
}

function displaySidebarDetails(feature) {
    $('#sidebar')
        .empty()
        .addClass('sidebar-open');

    if (feature.properties.WEBSITE == undefined) {
        $('#sidebar').append(
            `<input type="image" src="images/arrow.svg" name="close" alt="close" id="js-close" class="close-arrow" onclick="closeSideBar();"/>
            <p class="sidebar-subhead">${feature.properties.CATEGORY}</p>
            <h2>${feature.properties.TITLE}</h2>
            <p class="sidebar-description">${feature.properties.SHORT_DESCRIPTION}</p>
            <p class="sidebar-address-1">${feature.properties.ADDRESS_LINE1},<br>
             ${feature.properties.CITY}, ${feature.properties.STATE}</p>
            `);
    } else {
        $('#sidebar').append(
            `<input type="image" src="images/arrow.svg" name="close" alt="close" id="js-close" class="close-arrow" onclick="closeSideBar();"/>
            <p class="sidebar-subhead">${feature.properties.CATEGORY}</p>
            <h2>${feature.properties.TITLE}</h2>
            <p class="sidebar-description">${feature.properties.SHORT_DESCRIPTION}</p>
            <p class="sidebar-website"><a href="${feature.properties.WEBSITE}" target="_blank">${feature.properties.WEBSITE}</a></p>
            <p class="sidebar-address-2">${feature.properties.ADDRESS_LINE1},<br>
             ${feature.properties.CITY}, ${feature.properties.STATE}</p>
            `);
    };
    
    // Retrieve data from Eventbrite API and add to sidebar
    let venueId = feature.properties.EVENTBRITE_ID;
    let url = searchEventsURL + venueId + '/events/?expand=venue';    
    if (isNaN(venueId)) {
    } else {
        getEvents(url, options);
    };
    
    // Hide close list button for desktop when sidebar is open
    if ($(window).width() >= 1200) {
        $('.close-list').addClass('desktop-hidden');
    };
}

function getEvents(url, options) {
    fetch(url, options)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
            throw new Error(response.error_description);
        })
    .then(function(responseJson) {
        $('#sidebar').append(`
            <div id="upcoming-events">
                <h3 class="sidebar-event-heading">Upcoming Events</h3>
                <div class="upcoming-events-container"></div>
            </div>
            <div id="past-events">
                <h3 class="sidebar-event-heading">Past Events</h3>
                <div class="past-events-container"></div>
            </div>`
        );

        for (let i = 0; i < responseJson.events.length; i++) {
            let todayDate = new Date();
            let dateStr = new Date(responseJson.events[i].start.local);

            // Converts date into readable format
            let options = {hour12: true, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }
            let date = dateStr.toLocaleDateString('en-US', options);

            // Checks if event has passed
            if (dateStr < todayDate) {
                // Adds event info to past events container
                $('.past-events-container').prepend(
                    `<div class="event">
                        <a href = "${responseJson.events[i].url}" target = "_blank"><img src="${responseJson.events[i].logo.url}"/></a>
                        <div class="event-text-container">
                            <a href = "${responseJson.events[i].url}" target = "_blank"><h4 class="sidebar-event-title">${responseJson.events[i].name.text}</h4></a>
                            <p class="sidebar-event-date">${date}</p>
                        </div>
                    </div>`)
            } else {
                // Adds event info to upcoming events container
                $('.upcoming-events-container').prepend(
                    `<div class="event">
                        <a href = "${responseJson.events[i].url}" target = "_blank"><img src="${responseJson.events[i].logo.url}"/></a>
                        <div class="event-text-container">
                            <a href = "${responseJson.events[i].url}" target = "_blank"><h4 class="sidebar-event-title">${responseJson.events[i].name.text}</h4></a>
                            <p class="sidebar-event-date">${date}</p>
                        </div>
                    </div>`)
            };
        };  

        // If there are no upcoming events, remove container
        if ($('.upcoming-events-container').children().length == 0) {
            $('#upcoming-events').remove();
        };
        
        // If there are no past events, remove container
        if ($('.past-events-container').children().length == 0) {
            $('#past-events').remove();
        };
    });
}

function handleFilterClick() {
    $('.js-filter-button').click(function() {

        // If there are open popups, remove them
        let popUps = $('.mapboxgl-popup');
        if (popUps[0]) popUps[0].remove();
        
        // Check the current zoom level and center position of the map
        let center = map.getCenter();
        let newLng = center.lng.toFixed(3);
        let newLat = center.lat.toFixed(3);
        let centerString = `lng: ${newLng}, lat: ${newLat}`
        let zoom = map.getZoom();

        // Mobile
        if ($(window).width() < 1200){
            // If current zoom and center are at the default positions,
            // then update map filter and listings
            if (centerString == 'lng: -122.406, lat: 37.780' && zoom == 13.2) {
                let selectedFilter = $('input.js-filter-button:checked').val();
                updateList(selectedFilter);
                updateMapView(selectedFilter);

            // Otherwise reset the zoom and center first before updating map filter and listings
            //  (this is bc it can only query visible points on the map)
            } else {
                map.flyTo({
                    center: [-122.406, 37.780],
                    zoom: 13.2
                });
    
                map.on('zoomend', function () {
                    let selectedFilter = $('input.js-filter-button:checked').val();
                    updateList(selectedFilter);
                    updateMapView(selectedFilter);
                });
            }
        };

        // Desktop
        if ($(window).width() >= 1200){
            // If current zoom and center are at the default positions,
            // then update map filter and listings
            if (centerString == 'lng: -122.409, lat: 37.780' && zoom == 14) {
                let selectedFilter = $('input.js-filter-button:checked').val();
                updateList(selectedFilter);
                updateMapView(selectedFilter);

            // Otherwise reset the zoom and center first before updating map filter and listings
            //  (this is bc it can only query visible points on the map)
            } else {
                map.flyTo({
                    center: [-122.409, 37.780],
                    zoom: 14
                });
    
                map.on('zoomend', function () {
                    let selectedFilter = $('input.js-filter-button:checked').val();
                    updateList(selectedFilter);
                    updateMapView(selectedFilter);
                });
            }
        };
        
        // Reset the scroll to the top of the listings
        $('.listings').scrollTop(0);
        $(window).scrollTop(0);
    });
}

// Updates map view based on filter selected
function updateMapView(selectedFilter) {
    if (selectedFilter == 'All'){
        map.setFilter('soma-pilipinas');
    } else {
        map.setFilter('soma-pilipinas', ['==', 'TYPE', selectedFilter]);
    };
}

// Adds list of all points of interest to #listings by default
function buildDefaultList() {
    map.on('load', function () {
        let defaultFilter = map.querySourceFeatures('composite', {
            sourceLayer: 'soma-pilipinas', 
            filter: ['has', 'TYPE'],
        });
        displayResults(defaultFilter);

        // Resets filter selection to "All"
        $('input#all').prop('checked', 'true');
    });
}

function openList() {
    // Mobile
    $('.mobile-open-list').click(function() {
        // Resize map container and recenter
        $('#map').removeClass('mobile-map-tall');
        map.resize();
        map.setZoom(13.2);

        // Reposition map filter and show listings
        $('#map-filter').removeClass('map-filter-short');
        $('.listings').removeClass('mobile-hidden');
        handleStickyFilter();

        // Change show list button to close button
        $('.mobile-open-list').addClass('mobile-hidden');
        $('.mobile-close-list').removeClass('mobile-hidden');
        closeList();
    });

    // Desktop
    $('.open-list').click(function() {
        $('.listings').removeClass('desktop-hidden');
        $('#map').addClass('map-expanded');
        
        $('.open-list').addClass('desktop-hidden');
        $('.close-list').removeClass('desktop-hidden');

        // Delays transitions to execute after display property updates
        listingsOpenTransition();
        closeList();
    });
}

// Delays transitions when #listings is opened
function listingsOpenTransition() {
    setTimeout(function(){ 
        $('.listings').addClass('desktop-expanded');
        $('#nav').addClass('nav-expanded');
        $('.open-list').addClass('fade-out');
        }, 200);

    setTimeout(function(){ 
        $('.close-list').removeClass('fade-out');
        }, 500);

    setTimeout(function(){map.resize();}, 300);
}

function closeList() {
    // Mobile
    $('.mobile-close-list').click(function() {
        // Resize mapp container and recenter
        $('#map').addClass('mobile-map-tall');
        map.resize();

        // Reposition map filter and show listings
        $('#map-filter').addClass('map-filter-short');
        $('.listings').addClass('mobile-hidden');

        // Change show list button to close button
        $('.mobile-open-list').removeClass('mobile-hidden');
        $('.mobile-close-list').addClass('mobile-hidden');
    });

    // Desktop
    $('.close-list').click(function() {
        $('.listings').removeClass('desktop-expanded');
        $('#map').removeClass('map-expanded');
        $('#nav').removeClass('nav-expanded');

        $('.open-list').removeClass('desktop-hidden');
        $('.close-list').addClass('desktop-hidden');

        // Delays transitions to execute after display property updates
        listingsCloseTransition();
    });

    openList();
}

// Delays transitions when #listings is closed
function listingsCloseTransition() {
    setTimeout(function(){ 
        $('.listings').addClass('desktop-hidden');
        $('.open-list').removeClass('fade-out');
        $('.close-list').addClass('fade-out');}, 500);

    setTimeout(function(){map.resize();}, 320);
}

// Queries map data based on selected filter
function updateList(selectedFilter) {
    $('.listings').empty();
    if (selectedFilter == 'All'){
        let filteredFeatures = map.querySourceFeatures('composite', {
            sourceLayer: 'soma-pilipinas', 
            filter: ['has', 'TYPE'],
        })
        displayResults(filteredFeatures);
    } else {
        let filteredFeatures = map.querySourceFeatures('composite', {
            sourceLayer: 'soma-pilipinas', 
            filter: ['==', 'TYPE', selectedFilter],
        })
        displayResults(filteredFeatures);
    };
}

// Displays #listings based on filter selected
function displayResults(filteredFeatures) {
    let list = [];
    for (let i = 0; i < filteredFeatures.length; i++) {
        let filteredList = filteredFeatures[i];
        let item = filteredList.properties;
        let itemTitle = item.TITLE;
        list.push(itemTitle);
    }
    
    // Removes duplicates in mapbox data caused by tiling
    let newList = removeDupes(list);

    newList.sort().forEach(function(element){
        $('.listings').append(`
        <div class="button-container">
        <button class="fly-to-button" type="button" role="button" value="${element}" aria-label="${element}">${element}</button>
        </div>`);
    });

    // Listens for #listings click
    selectFromList();
}

function removeDupes(names) {
    let unique = {};
    names.forEach(function(i) {
        if(!unique[i]) {
            unique[i] = true;
        }
    });
  return Object.keys(unique);
}

function selectFromList() {
    $('.fly-to-button').click(function(){

        // If there are open popups, remove them
        let popUps = $('.mapboxgl-popup');
        if (popUps[0]) popUps[0].remove();
        
        closeListingsDrawer();

        // Resets zoom and map center based on listing selected
        let itemTitle = $(this).val();
        let features = map.querySourceFeatures('composite', {
            sourceLayer: 'soma-pilipinas', 
            filter: ['==', 'TITLE', itemTitle]
        })
        let feature = features[0];

        map.flyTo({
            center: feature.geometry.coordinates,
            zoom: 14.6,
        })

        // Adds popup based on listing selected
        addPopup(feature);
    });
}

function closeListingsDrawer() {
    // Closes the sliding #listings drawer in mobile
    if ($(window).width() < 1200) {
        // Resize mapp container and recenter
        $('#map').addClass('mobile-map-tall');
        map.resize();

        // Reposition map filter and show listings
        $('#map-filter').addClass('map-filter-short');
        $('.listings').addClass('mobile-hidden');

        // Change show list button to close button
        $('.mobile-open-list').removeClass('mobile-hidden');
        $('.mobile-close-list').addClass('mobile-hidden');
    }
}

// Makes #map-filter stick to the top of window when scrolling in mobile and tablet
function handleStickyFilter() {
    let filterOffset = $('#map-filter').offset().top;
    
    if ($(window).width() < 1200) {
        $(window).scroll(function(){

            let scroll = $(window).scrollTop();
    
            if (scroll >= filterOffset) {
                $('#map-filter').addClass('sticky-secondary');
                $('.listings').css('margin-top', '15vh');
            } 
            if (scroll < filterOffset) {
                $('#map-filter').removeClass('sticky-secondary');
                $('.listings').css('margin-top', '0');
            }
        });
    }
    if ($(window).width() < 768) {
            $(window).scroll(function(){

            let scroll = $(window).scrollTop();
    
            if (scroll >= filterOffset) {
                $('#map-filter').addClass('sticky-secondary');
                $('.listings').css('margin-top', '20vh');
            } 
            if (scroll < filterOffset) {
                $('#map-filter').removeClass('sticky-secondary');
                $('.listings').css('margin-top', '0');
            }
        });
    }
}

function handleWindowResize() {
    $(window).resize(function(){
        handleStickyFilter();
        setTimeout(function(){ 
            map.resize();}, 500);
        setZoom();
    });
}

function handleAboutButton() {
    $('.js-about-button').click(function() {
        closeListingsDrawer();

        $('#map-filter').removeClass('sticky-secondary');
        $('header').toggleClass('hide');
        $('main').toggleClass('hidden')

        map.resize();
        setZoom();
        handleStickyFilter();
        handleMapHover();
        handleMapClick();
        handleFilterClick();
        buildDefaultList();
        handleWindowResize();
        closeList();
    });
}

function handleMap() {
    handleAboutButton();
    setZoom();
    renderMap();
    buildDefaultList();
    handleWindowResize();
    closeList();
}

$(handleMap);