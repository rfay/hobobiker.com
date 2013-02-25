var map;

$(function () {
  showmap();
  $('#largermap').bind("click", function () {
    window.open('/tripinfo_maponly/' + $('#kmlfile').text() + "/" + $('#rssfile').text())
  });
});


function showmap() {
  if (!GBrowserIsCompatible()) {
    exit;
  }

  //$('#searchMap').css({width: "100%", height: "500px", border:"1px solid" });
  // $("p").css({ color: "red", background: "blue" });

  map = new google.maps.Map(document.getElementById("searchMap"));
//    map.addControl(new GLargeMapControl());
//    map.addControl(new GMapTypeControl());

  var kmlfile = $('#kmlfile').text();
  var rssfile = $('#rssfile').text();
  var geopics = new GGeoXml(rssfile);
  var geoxml = new google.maps.KmlLayer(kmlfile);
  geoxml.setMap(map);

}

