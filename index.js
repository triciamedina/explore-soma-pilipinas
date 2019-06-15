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
    center: [-122.407, 37.785],
    zoom: 12.7
});

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
    if ($(window).width() >= 1200) {
        map.setZoom(13.5)
    };
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
        `<h3>${feature.properties.TITLE}</h3>
        <button class="js-open-sidebar-button" type="button" role="button">Learn more</button>
        `)
        .addTo(map);
    
    openSideBar(feature);
    
    $("#filter").mousedown(function(){
        popup.remove();
    });
}

function openPopup() {
    $(".fly-to-button").click(function(){
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
            .removeClass("hidden")
            .append(
                `<input type="image" src="images/arrow.png" name="close" alt="close" id="js-close" class="close-arrow" onclick="closeSideBar();"/>
                <h3>${feature.properties.TITLE}</h3>
                <p>${feature.properties.TYPE}</p>
                <p>${feature.properties.SHORT_DESCRIPTION}</p>
                <p><a href="${feature.properties.WEBSITE}" target="_blank">${feature.properties.WEBSITE}</a></p>
                `);
        let venueId = feature.properties.EVENTBRITE_ID;
        let url = searchEventsURL + venueId + "/events/?expand=venue"
                
        if (isNaN(venueId)) {
        } else {
            $("#sidebar").append(`<h4>Events</h4>`);
            getEvents(url, options);
            };

        if ($(window).width() < 1200) {
            $("#map").addClass("hidden");
            $("#map-filter").addClass("hidden");
        }
        $("#listings").addClass("hidden");
    });

    closeSideBar();
}

function closeSideBar() {
        $("#sidebar").addClass("hidden");
        $("#map-filter").removeClass("hidden");
        $("#listings").removeClass("hidden");
        $("#map").removeClass("hidden");

}

function handleFilterClick() {
    $(".js-filter-button").click(function() {

        let popUps = document.getElementsByClassName('mapboxgl-popup');
        if (popUps[0]) popUps[0].remove();
        
        let center = map.getCenter();
        let newLng = center.lng.toFixed(3);
        let newLat = center.lat.toFixed(3);
        let centerString = `lng: ${newLng}, lat: ${newLat}`

        let zoom = map.getZoom();

        if (centerString == "lng: -122.407, lat: 37.785" && zoom == 12.7) {
            let selectedFilter = $("input.js-filter-button:checked").val();
            updateList(selectedFilter);
            updateMapView(selectedFilter);
        } else {
            map.flyTo({
                center: [-122.407, 37.785],
                zoom: 12.7
            });
    
            map.on('zoomend', function () {
                let selectedFilter = $("input.js-filter-button:checked").val();
                updateList(selectedFilter);
                updateMapView(selectedFilter);
            });
        }

        $("#listings").scrollLeft(0).scrollTop(0);
    });
}

function updateMapView(selectedFilter) {
    if (selectedFilter == "All"){
        $("#listings").removeClass("hidden");
        map.setFilter("soma-pilipinas");
    } else {
        $("#listings").removeClass("hidden");
        map.setFilter("soma-pilipinas", ["==", "TYPE", selectedFilter]);
    };
}

function updateList(selectedFilter) {
    $("#listings").empty();
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
        $("#listings").append(`<button class="fly-to-button" type="button" role="button" value="${element}">${element}</button>`)
    })

    openPopup();
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

function handleMap() {
    renderMap();
    handleMapClick();
    handleFilterClick();
    buildDefaultList();
}

$(handleMap);