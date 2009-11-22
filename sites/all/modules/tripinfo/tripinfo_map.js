
   var map;
   
$(function(){
  showmap();
  $('#largermap').bind("click", function(){
//  		var searchmap=$('#mapholder');
//  		$(searchmap).css('position','absolute');
//  		//$(searchmap).animate({position:'absolute'},'slow');
//  		$(searchmap).animate({left:0,top:0,zindex:999},'slow').animate({width:"100%",height:"500"},'slow');
//  		$('#searchMap').css({position:'relative'});
//  		$('#searchMap').css({width:'100%',height:'95%'});
//  		map.checkResize();
			window.open('/tripinfo_maponly/'+$('#kmlfile').text() +"/" + $('#rssfile').text())

	});
});   


function showmap() {
   if (!GBrowserIsCompatible()) { exit; }
   
   //$('#searchMap').css({width: "100%", height: "500px", border:"1px solid" });
   // $("p").css({ color: "red", background: "blue" });
   
    map = new GMap2(document.getElementById("searchMap")); 
    map.addControl(new GLargeMapControl());
    map.addControl(new GMapTypeControl());

    var kmlfile = $('#kmlfile').text();
    var rssfile = $('#rssfile').text();
	var geopics = new GGeoXml(rssfile);
    var geoxml = new GGeoXml(kmlfile, function() {
	    var center = geoxml.getDefaultCenter()
	
	    map.setCenter(center,11);
		map.setZoom(map.getBoundsZoomLevel(geoxml.getDefaultBounds()));
	
	    map.addControl(new GLargeMapControl());
	    map.addOverlay(geoxml);
	    map.addOverlay(geopics);

    } );
    	
  
}

