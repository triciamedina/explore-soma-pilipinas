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
        $("#listings").empty();
        let selectedFilter = $(this).val();

        if (selectedFilter == "Reset"){
            map.setFilter("soma-pilipinas", ["has", "TYPE"]);
        } else {
            map.setFilter("soma-pilipinas", ["==", "TYPE", selectedFilter]);
        };

        //Query map based on selected filter
        let filteredFeatures = map.queryRenderedFeatures({
            layers: ["soma-pilipinas"],
            filter: ["==", "TYPE", selectedFilter],
        });

        // Display a list of results in a popup sidebar
        
        buildFilterList(filteredFeatures);
    });
    
}

function buildFilterList(data) {
    
    for (let i = 0; i < data.length; i++) {
        let currentFeature = data[i];
        let prop = currentFeature.properties;
        $("#listings").append(`<h3>${prop.TITLE}</h3>`)
    }
}

function handleMap() {
    renderMap();
    handleMapClick();
    handleFilterClick();
}

$(handleMap);
