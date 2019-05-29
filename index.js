'use strict';

mapboxgl.accessToken = 'pk.eyJ1IjoidHJpY2lhbWVkaW5hIiwiYSI6ImNqdm9uOGYweDIwYTU0M29qbnQ4dnA1ZHEifQ.33vfmiE7P9ufCrkjUmNoxQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/triciamedina/cjw8micvr5so61cpi0wx38qnr',
    center: [-122.407, 37.783],
    zoom: 13.7
});

let zoom = new mapboxgl.NavigationControl({showCompass: false,});
map.addControl(zoom, "bottom-right");

function handleMap() {
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
            .setHTML(`<h3>${feature.properties.POI_NAME}</h3>`)
            .addTo(map);
    })
}

$(handleMap);
