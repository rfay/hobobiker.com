$(document).ready(function(){
	$(".togglebtn").click(function () {
		// Looks down from 2 levels up for an element with class=toggle
		$(this).parent().parent().find('.toggle').toggle("slow");
	});

});
