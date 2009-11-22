
var maponly_map;



$(function(){
  if ( typeof(GBrowserIsCompatible) == "undefined" || !GBrowserIsCompatible()) { return; }
  $(window).unload( function () { GUnload();  } );


  var Client = {
  viewportWidth: function() {
    return self.innerWidth || (document.documentElement.clientWidth || document.body.clientWidth);
  },

  viewportHeight: function() {
    return self.innerHeight || (document.documentElement.clientHeight || document.body.clientHeight);
  },
  
  viewportSize: function() {
    return { width: this.viewportWidth(), height: this.viewportHeight() };
  }
};

  var vpheight=Client.viewportHeight();
  $('#mapholder').css('height',vpheight + "px");
  //console.log("setting height to " + vpheight)
  
  showmap();
  
});

function setbounds(map,thisoverlay) {
  var center = thisoverlay.getDefaultCenter();
  if (center.lat() == 0 && center.lng() == 0) {   // Assume failure on lat=lng=0
    tripinfo_filtermap_overlayfailed = true;
  } else {

    map.setCenter(center,11);
    map.setZoom(map.getBoundsZoomLevel(thisoverlay.getDefaultBounds()));
    // map.setMapType(G_PHYSICAL_MAP);
  }

}

function showmap() {
  maponly_map = new GMap2(document.getElementById("maponly_map"));
  maponly_map.addControl(new GLargeMapControl());
  maponly_map.addControl(new GMapTypeControl());
  maponly_map.addControl(new GOverviewMapControl());
  maponly_map.addControl(new GScaleControl());
  maponly_map.addMapType(G_PHYSICAL_MAP);

  var geoxmloverlays = new Array();

  $('.geoxmlfile').each( function(i) {
    var item = this.firstChild.nodeValue;
    if (i == 0) {
      geoxmloverlays[i] = new GGeoXml(item,  function() {
        setbounds(maponly_map,geoxmloverlays[i]);
        var thisoverlay = geoxmloverlays[0];

        var cnt=0;
        for (cnt=0; cnt<geoxmloverlays.length; cnt++) {
          maponly_map.addOverlay(geoxmloverlays[cnt]);
        }

      } );
    } else {
      geoxmloverlays[i] = new GGeoXml(item);
    }

  }

  );




}

