

$(function(){
  showmap();


});

var tripinfo_filtermap_overlayfailed=false;
var notified=false;


function setbounds(map,thisoverlay) {
  var basecenter = thisoverlay.getDefaultCenter();
  var center = new GLatLng(basecenter.lat(),basecenter.lng());
  if (center == null || center.lat() == 0 && center.lng() == 0) {   // Assume failure on lat=lng=0
    tripinfo_filtermap_overlayfailed = true;
  } else {

    map.setCenter(center);
    var bounds = thisoverlay.getDefaultBounds();
    var zoomlevel=map.getBoundsZoomLevel(bounds);

    map.setZoom(zoomlevel);
  }

}
function showmap() {

  if ( typeof(GBrowserIsCompatible) == "undefined" || !GBrowserIsCompatible()) { return; }
  $(window).unload( function () { GUnload(); } );

  $('.mapholder').css({width:"100%", height:"100%"});
  $('.filtermap').css({width: "100%", height: "90%", border:"1px solid", margin:"1px","padding":"1px" });

  $('.mapholder').each( function(i) {

    var mapholder = this;
    var filtermap = $(this).children('.filtermap')[0];

    var map = new GMap2(filtermap);
    var geoxmloverlays = new Array();

    var geoxmlfiles = $(this).children('.geoxmlfile');

    $(this).children('.geoxmlfile').each( function(j) {
      var item = this.firstChild.nodeValue;
      geoxmloverlays[j] = new GGeoXml(item,  function() {
        var thisoverlay = geoxmloverlays[j];
        if (!thisoverlay.loadedCorrectly() || !thisoverlay.hasLoaded()) {
          tripinfo_filtermap_overlayfailed = true;
        }
        if (j==0) {
          setbounds(map,thisoverlay);
          // The controls and such can't be done until the center is set
          if ( $(filtermap).width() > 300 && $(filtermap).height() >300) {
            map.addControl(new GLargeMapControl());
            map.addControl(new GScaleControl());
            map.addControl(new GMapTypeControl());
            map.addControl(new GOverviewMapControl());

          } else {
            map.addControl(new GSmallMapControl());
          }
          map.addMapType(G_PHYSICAL_MAP);
          // map.setMapType(G_PHYSICAL_MAP);

        }
        map.addOverlay(thisoverlay);

              if (tripinfo_filtermap_overlayfailed && !notified) {
                tripinfo_filtermap_overlayfailed=false; // Only do it once
                notified=true;
                $(mapholder).after('<p style="background-color:yellow">Google failed one or more overlays. Sorry!</p>');
              }


              } );

            } );

          } );

        }

