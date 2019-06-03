"use strict";

mapboxgl.accessToken = "pk.eyJ1IjoidHJpY2lhbWVkaW5hIiwiYSI6ImNqdm9uOGYweDIwYTU0M29qbnQ4dnA1ZHEifQ.33vfmiE7P9ufCrkjUmNoxQ";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/triciamedina/cjw8micvr5so61cpi0wx38qnr?fresh=true",
    center: [-122.407, 37.783],
    zoom: 13.7
});

function renderMap() {
    let zoom = new mapboxgl.NavigationControl({showCompass: false,});
    map.addControl(zoom, "bottom-right");
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

        let popup = new mapboxgl.Popup({ 
            offset: [0, -15],
            closeButton: true,
            closeOnClick: true,
            })
            .setLngLat(feature.geometry.coordinates)
            .setHTML(`<h3>${feature.properties.TITLE}</h3><p>${feature.properties.SHORT_DESCRIPTION}</p>`)
            .addTo(map);
        
        $("#filter").mousedown(function(){
            popup.remove();
        });
    })
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

function updateMapView(selectedFilter) {
    if (selectedFilter == "Reset"){
        $("#listings").addClass("hidden");
        map.setFilter("soma-pilipinas", ["has", "TYPE"]);
    } else {
        $("#listings").removeClass("hidden");
        map.setFilter("soma-pilipinas", ["==", "TYPE", selectedFilter]);
    };
}

function displayResults(data) {
    let newList = [];
    for (let i = 0; i < data.length; i++) {
        let filteredFeatures = data[i];
        let item = filteredFeatures.properties;
        newList.push(item.TITLE);
    }
    console.log(newList.sort());

    newList.forEach(function(element){
        $("#listings").append(`<h3>${element}</h3>`)
    })
}

function handleMap() {
    renderMap();
    handleMapClick();
    handleFilterClick();
}

$(handleMap);