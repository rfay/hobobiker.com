$(document).ready(function () {
  showmap();
});

function showmap() {

  var mapOptions = {
    // center:new google.maps.LatLng(defaultLocation.latitude, defaultLocation.longitude),
    // zoom:defaultLocation.zoom,
    mapTypeId:google.maps.MapTypeId.TERRAIN,
    scaleControl: true,
    overviewMapControl: true,
      preserveViewport: true
  };

  var map = new google.maps.Map(document.getElementById("filtermap"), mapOptions);
  // The kmlfile must be internet-reachable, so for local debugging, point it to hobobiker.com
  // var kmlfile = "https://hobobiker.com" + Drupal.settings.tripinfo.kmlfile;
  var kmlfile = Drupal.settings.tripinfo.kmlfile;

    var geoxml = new google.maps.KmlLayer({
      url: kmlfile,
      map: map
  });
}
