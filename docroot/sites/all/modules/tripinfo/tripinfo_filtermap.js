$(document).ready(function () {
  showmap();
});

function showmap() {

  var mapOptions = {
    // center:new google.maps.LatLng(defaultLocation.latitude, defaultLocation.longitude),
    // zoom:defaultLocation.zoom,
    mapTypeId:google.maps.MapTypeId.TERRAIN,
    scaleControl: true,
    overviewMapControl: true
  };

  var map = new google.maps.Map(document.getElementById("filtermap"), mapOptions);
  var kmlfile = Drupal.settings.tripinfo.kmlfile;
  var geoxml = new google.maps.KmlLayer(kmlfile);
  geoxml.setMap(map);
}
