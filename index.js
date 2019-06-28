"use strict";

const searchEventsURL = "https://www.eventbriteapi.com/v3/venues/";

const options = {
    headers: new Headers ({
        "Authorization": "Bearer CYLALJ2NCH7KAVFBMDQE",
    })
};

mapboxgl.accessToken = "pk.eyJ1IjoidHJpY2lhbWVkaW5hIiwiYSI6ImNqdm9uOGYweDIwYTU0M29qbnQ4dnA1ZHEifQ.33vfmiE7P9ufCrkjUmNoxQ";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/triciamedina/cjw8micvr5so61cpi0wx38qnr?fresh=true",
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
    map.addControl(zoom, "bottom-left");
    map.scrollZoom.disable();
    map.on("mouseenter", "soma-pilipinas", function(e) {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on("mouseleave", "soma-pilipinas", function() {
        map.getCanvas().style.cursor = "";
    });
}

function addPopup(feature) {
    let popUps = document.getElementsByClassName('mapboxgl-popup');
    if (popUps[0]) popUps[0].remove();

    let popup = new mapboxgl.Popup({ 
        offset: [0, -15],
        closeButton: true,
        closeOnClick: true,
        })
        .setLngLat(feature.geometry.coordinates)
        .setHTML(
        `<h2>${feature.properties.TITLE}</h2>
        <button class="js-open-sidebar-button" type="button" role="button" aria-label="Learn more">Learn more</button>
        `)
        .addTo(map);
    
    openSideBar(feature);
    
    $("#filter").mousedown(function(){
        popup.remove();
    });
}

function selectFromList() {
    $(".fly-to-button").click(function(){

        // Closes the sliding #listings drawer in mobile
        if ($(window).width() < 1200) {
            // $(window).scrollTop(0);
            // Resize mapp container and recenter
            $("#map").addClass("mobile-map-tall");
            map.resize();

            // Reposition map filter and show listings
            $("#map-filter").addClass("map-filter-short");
            $(".listings").addClass("mobile-hidden");

            // Change show list button to close button
            $(".mobile-open-list").removeClass("mobile-hidden");
            $(".mobile-close-list").addClass("mobile-hidden");
        }
        
        let itemTitle = $(this).val();
        let features = map.querySourceFeatures("composite", {
            sourceLayer: "soma-pilipinas", 
            filter: ["==", "TITLE", itemTitle]
        })
        let feature = features[0];

        map.flyTo({
            center: feature.geometry.coordinates,
        })
        addPopup(feature);
    });
}

function handleMapClick() {
    map.on("click", function(e) {
        let features = map.queryRenderedFeatures(e.point, {
            layers: ["soma-pilipinas"] 
        });
        if (!features.length) {
            return;
        }
        let feature = features[0];

        map.flyTo({
            center: feature.geometry.coordinates,
        })

        addPopup(feature);
    })
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
        for (let i = 0; i < responseJson.events.length; i++){
            $("#sidebar").append(
                `<h4>${responseJson.events[i].name.text}</h4>
                <p>${responseJson.events[i].start.local}</p>
                <p><a href = "${responseJson.events[i].url}" target = "_blank">Get tickets</a></p>
                `)
            } 
         })
}

function openSideBar(feature) {
    $(".js-open-sidebar-button").click(function() {
        $("#sidebar")
            .empty()
            .addClass("sidebar-open")
            .append(
                `<input type="image" src="images/arrow.svg" name="close" alt="close" id="js-close" class="close-arrow" onclick="closeSideBar();"/>
                <h2>${feature.properties.TITLE}</h2>
                <p class="sidebar-subhead">${feature.properties.TYPE}</p>
                <p class="sidebar-description">${feature.properties.SHORT_DESCRIPTION}</p>
                <p><a href="${feature.properties.WEBSITE}" target="_blank">${feature.properties.WEBSITE}</a></p>
                `);
        let venueId = feature.properties.EVENTBRITE_ID;
        let url = searchEventsURL + venueId + "/events/?expand=venue"
                
        if (isNaN(venueId)) {
        } else {
            $("#sidebar").append(`<h3>Events</h3>`);
            getEvents(url, options);
            };

        if ($(window).width() >= 1200) {
            $(".close-list").addClass("desktop-hidden");
        }
    });

    // closeSideBar();
}

function closeSideBar() {
        $("#sidebar").removeClass("sidebar-open");
        // $("#map-filter").removeClass("hidden");
        // $(".listings").Class("hidden");
        // $("#map").removeClass("hidden");
        
        if ($(window).width() >= 1200) {
            $(".close-list").removeClass("desktop-hidden");
        }
}

function handleFilterClick() {
    $(".js-filter-button").click(function() {

        // If there are open popups, remove them
        let popUps = document.getElementsByClassName('mapboxgl-popup');
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
            if (centerString == "lng: -122.406, lat: 37.780" && zoom == 13.2) {
                let selectedFilter = $("input.js-filter-button:checked").val();
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
                    let selectedFilter = $("input.js-filter-button:checked").val();
                    updateList(selectedFilter);
                    updateMapView(selectedFilter);
                });
            }
        }

        // Desktop
        if ($(window).width() >= 1200){
            // If current zoom and center are at the default positions,
            // then update map filter and listings
            if (centerString == "lng: -122.409, lat: 37.780" && zoom == 14) {
                let selectedFilter = $("input.js-filter-button:checked").val();
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
                    let selectedFilter = $("input.js-filter-button:checked").val();
                    updateList(selectedFilter);
                    updateMapView(selectedFilter);
                });
            }
        }
        

        // Reset the scroll to the top of the listings
        $(".listings").scrollTop(0);
        $(window).scrollTop(0);
    });
}

function updateMapView(selectedFilter) {
    if (selectedFilter == "All"){
        map.setFilter("soma-pilipinas");
    } else {
        map.setFilter("soma-pilipinas", ["==", "TYPE", selectedFilter]);
    };
}

function openList() {
    // Mobile
    $(".mobile-open-list").click(function() {
        // Resize map container and recenter
        $("#map").removeClass("mobile-map-tall");
        map.resize();
        map.setZoom(12.5);

        // Reposition map filter and show listings
        $("#map-filter").removeClass("map-filter-short");
        $(".listings").removeClass("mobile-hidden");
        handleStickyFilter();

        // Change show list button to close button
        $(".mobile-open-list").addClass("mobile-hidden");
        $(".mobile-close-list").removeClass("mobile-hidden");
        closeList();
    });

    // Desktop
    $(".open-list").click(function() {
        $(".listings").removeClass("desktop-hidden");
        $("#map").addClass("map-expanded");
        
        $(".open-list").addClass("desktop-hidden");
        $(".close-list").removeClass("desktop-hidden");

        // Delays transitions to execute after display property updates
        listingsOpenTransition();
        closeList();
    })
   
}

function listingsOpenTransition() {
    setTimeout(function(){ 
        $(".listings").addClass("desktop-expanded");
        $("#nav").addClass("nav-expanded");
        $(".open-list").addClass("fade-out");
        }, 200);

    setTimeout(function(){ 
        $(".close-list").removeClass("fade-out");
        }, 500);

    setTimeout(function(){ 
        map.resize();}, 300);
}

function closeList() {
    $(".mobile-close-list").click(function() {
        // Resize mapp container and recenter
        $("#map").addClass("mobile-map-tall");
        map.resize();

        // Reposition map filter and show listings
        $("#map-filter").addClass("map-filter-short");
        $(".listings").addClass("mobile-hidden");

        // Change show list button to close button
        $(".mobile-open-list").removeClass("mobile-hidden");
        $(".mobile-close-list").addClass("mobile-hidden");
    });

    $(".close-list").click(function() {
        $(".listings").removeClass("desktop-expanded");
        $("#map").removeClass("map-expanded");
        $("#nav").removeClass("nav-expanded");

        $(".open-list").removeClass("desktop-hidden");
        $(".close-list").addClass("desktop-hidden");

        listingsCloseTransition();
    });

    openList();
}

function listingsCloseTransition() {
    setTimeout(function(){ 
        $(".listings").addClass("desktop-hidden");
        $(".open-list").removeClass("fade-out");
        $(".close-list").addClass("fade-out");}, 500);

    setTimeout(function(){ 
        map.resize();}, 320);
}

function updateList(selectedFilter) {
    $(".listings").empty();
    if (selectedFilter == "All"){
        let filteredFeatures = map.querySourceFeatures("composite", {
            sourceLayer: "soma-pilipinas", 
            filter: ["has", "TYPE"],
        })
        displayResults(filteredFeatures);
    } else {
        let filteredFeatures = map.querySourceFeatures("composite", {
            sourceLayer: "soma-pilipinas", 
                filter: ["==", "TYPE", selectedFilter],
            })
        displayResults(filteredFeatures);
        };
}

function displayResults(filteredFeatures) {
    let list = [];
    for (let i = 0; i < filteredFeatures.length; i++) {
        let filteredList = filteredFeatures[i];
        let item = filteredList.properties;
        let itemTitle = item.TITLE;
        list.push(itemTitle);
    }
    
    let newList = removeDupes(list);

    newList.sort().forEach(function(element){
        $(".listings").append(`
        <div class="button-container">
        <button class="fly-to-button" type="button" role="button" value="${element}" aria-label="${element}">${element}</button>
        </div>`)
    })

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

function buildDefaultList() {
    map.on('load', function () {
        let defaultFilter = map.querySourceFeatures("composite", {
            sourceLayer: "soma-pilipinas", 
            filter: ["has", "TYPE"],
        });
        displayResults(defaultFilter);
    })
}

function handleStickyNav() {
    let navOffset = $("#nav").offset().top;

        $(window).scroll(function(){

            let scroll = $(window).scrollTop();
            if (scroll >= navOffset) {
                $("#nav").addClass("sticky-primary");
                $("header").addClass("hidden");
            } 
            // if (scroll < navOffset) {
            //     $("#nav").removeClass("sticky-primary");
            // }
        });
}

function handleStickyFilter() {
    let filterOffset = $("#map-filter").offset().top;
    
    if ($(window).width() < 1200) {
        $(window).scroll(function(){

            let scroll = $(window).scrollTop();
    
            if (scroll >= filterOffset) {
                // $("#map-filter").removeClass("map-filter-tall")
                $("#map-filter").addClass("sticky-secondary");
                $(".listings").css("margin-top", "20vh");
            } 
            if (scroll < filterOffset) {
                $("#map-filter").removeClass("sticky-secondary");
                $(".listings").css("margin-top", "0");
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
    $(".js-about-button").click(function() {
        $("header").toggleClass("hidden");
        $("main").toggleClass("hidden")

        map.resize();
        setZoom();
        handleStickyFilter();
        handleMapClick();
        handleFilterClick();
        buildDefaultList();
        handleStickyNav();
        handleWindowResize();
        closeList();
    })
}

function handleMap() {
    handleAboutButton();
    setZoom();
    // handleStickyFilter();
    // renderMap();
    // handleMapClick();
    // handleFilterClick();
    buildDefaultList();
    // handleStickyNav();
    handleWindowResize();
    // closeList();
}

$(handleMap);