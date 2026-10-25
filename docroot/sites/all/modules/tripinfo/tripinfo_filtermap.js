$(document).ready(function () {
  $('.tripinfo-map').each(function () {
    showmap(this);
  });
});

// Draw the KML or KMZ file named in the element's data-kml attribute on an
// OpenStreetMap base map. See tripinfo_map_div() in tripinfo.module.
function showmap(element) {
  var kmlurl = element.getAttribute('data-kml');

  var map = L.map(element, {scrollWheelZoom: false}).setView([20, -90], 3);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.control.scale().addTo(map);

  var isKmz = /\.kmz$/i.test(kmlurl.split('?')[0]);
  fetch(kmlurl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return isKmz ? response.arrayBuffer().then(kmzToText) : response.text();
    })
    .then(function (text) {
      var kml = new DOMParser().parseFromString(text, 'text/xml');
      var layer = L.geoJSON(toGeoJSON.kml(kml), {
        style: function (feature) {
          return {
            color: feature.properties.stroke || '#d00',
            weight: feature.properties['stroke-width'] || 3,
            opacity: feature.properties['stroke-opacity'] || 0.9
          };
        },
        onEachFeature: function (feature, featureLayer) {
          if (feature.properties.name) {
            var popup = document.createElement('span');
            popup.textContent = feature.properties.name;
            featureLayer.bindPopup(popup);
          }
        }
      }).addTo(map);
      if (layer.getBounds().isValid()) {
        map.fitBounds(layer.getBounds());
      }
    })
    .catch(function (error) {
      window.console && console.error('tripinfo map: could not load ' + kmlurl + ': ' + error.message);
    });
}

// A KMZ file is a zip archive holding one KML document (doc.kml).
function kmzToText(buffer) {
  return JSZip.loadAsync(buffer).then(function (zip) {
    var kml = zip.file(/\.kml$/i)[0];
    if (!kml) {
      throw new Error('no .kml file inside the KMZ');
    }
    return kml.async('string');
  });
}
