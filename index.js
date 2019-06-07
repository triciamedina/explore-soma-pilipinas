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
    center: [-122.407, 37.783],
    zoom: 13.7
});

function renderMap() {
    let zoom = new mapboxgl.NavigationControl({showCompass: false,});
    map.addControl(zoom, "bottom-left");
    map.on("mouseenter", "soma-pilipinas", function(e) {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on("mouseleave", "soma-pilipinas", function() {
        map.getCanvas().style.cursor = "";
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

        $("#listings").empty();

        // if (isNaN(venueId)) {
        // } else {
        //     $("#listings").append(`<h4>Events</h4>`);
        //     getEvents(url, options);
        // }
    })
}

function flyToMarker() {
    $(".fly-to-button").click(function(){
        let itemTitle = $(this).val();

        let features = map.queryRenderedFeatures({
            layers: ["soma-pilipinas"],
            filter: ["==", "TITLE", itemTitle]
        })

        let feature = features[0];

        // map.flyTo({
        //     center: feature.geometry.coordinates,
        //     zoom: 16
        // })
        addPopup(feature);
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
        `<h3>${feature.properties.TITLE}</h3>
        <p>${feature.properties.SHORT_DESCRIPTION}</p>
        <button class="js-details-button" type="button" role="button">Learn more</button>
        `)
        .addTo(map);
    
    openDetails(feature);
    
    $("#map").mousedown(function() {
        $("#listings").addClass("hidden")
    })

    $("#filter").mousedown(function(){
        popup.remove();
    });
}

function openDetails(feature) {
    $(".js-details-button").click(function() {
        $("#listings")
            .empty()
            .removeClass("hidden")
            .prepend(
                `<h3>${feature.properties.TITLE}</h3>
                <p>${feature.properties.TYPE}</p>
                <p>${feature.properties.SHORT_DESCRIPTION}</p>
                <p><a href="${feature.properties.WEBSITE}" target="_blank">${feature.properties.WEBSITE}</a></p>
                `);
        let venueId = feature.properties.EVENTBRITE_ID;
        let url = searchEventsURL + venueId + "/events/?expand=venue"
                
        if (isNaN(venueId)) {
        } else {
            $("#listings").append(`<h4>Events</h4>`);
            getEvents(url, options);
            }
    });

    
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
            $("#listings").append(
                `<h4>${responseJson.events[i].name.text}</h4>
                <p>${responseJson.events[i].start.local}</p>
                <p><a href = "${responseJson.events[i].url}" target = "_blank">Get tickets</a></p>
                `)
            } 
         })
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

    flyToMarker();
    
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

function updateMapView(selectedFilter) {
    if (selectedFilter == "Reset"){
        $("#listings").addClass("hidden");
        map.setFilter("soma-pilipinas", ["has", "TYPE"]);
    } else {
        $("#listings").removeClass("hidden");
        map.setFilter("soma-pilipinas", ["==", "TYPE", selectedFilter]);
    };
}

function handleFilterClick() {
    $(".js-filter-button").click(function() {
        let selectedFilter = $(this).val();
        updateList(selectedFilter);
        updateMapView(selectedFilter);
    });
}

function updateList(selectedFilter) {
    $("#listings").empty();
    let filteredFeatures = map.querySourceFeatures("composite", {
        sourceLayer: "soma-pilipinas", 
        filter: ["==", "TYPE", selectedFilter],
    })
    
    displayResults(filteredFeatures);
}

function handleMap() {
    renderMap();
    handleMapClick();
    handleFilterClick();
}

$(handleMap);