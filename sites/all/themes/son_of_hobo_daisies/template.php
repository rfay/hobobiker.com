<?php

/**
 * Hobobiker extensions to the theme
 */


function hobo_daisies_flickr_filter_photo($p, $size = NULL, $attribs = NULL) {
  
	//$attribs=array_merge(array('class'=>'thickbox'),$attribs);
  $flickr_photo_base="http://flickr.com/photos/hobobiker";
  $photo_url = flickr_photo_page_url($p['owner'] , $p['id']);
  // drupal_set_message('photo_url='.$photo_url);
  $title = hobo_daisies_flickr_photo_title(is_array($p['title']) ? $p['title']['_content'] : $p['title']);
  if (is_array($p['title'])) {
    $p['title']['_content'] = $title;
  }
  $titlewithlink = $title. " ".
    l("(View on flickr)",$photo_url,array('html'=>TRUE, 'attributes'=>array('target'=>"_blank")));
    
  $img = flickr_img($p, $size, $attribs);
  $bigimg=flickr_photo_img($p,null,$attribs);
  

  $width = flickr_get_photo_width($p['id'],$size) . "px";
  $output = "<div class='flickr-img-wrapper' style='width:$width'>" .
   l($img,$bigimg, array('html'=>TRUE, 'attributes'=> array('title'=>$title, 'class'=>'thickbox', 'rel'=>'gallery'))) ;
  if ($size != 's') { 
    $output .= "<div class='caption generated-caption' style='width:$width'><em>$titlewithlink</em> </div>";
  }
  // This is the CSS way to preload.
  // $output .= "<img src='$bigimg' class='tester' style='display:none;' />";
  $output .= "</div>";
  return $output;
}

function hobo_daisies_flickr_photo_title($title) {
	$parts = split(' ',$title,2);
	if (!strncmp("DSC",$parts[0],3) || !strncmp('100_',$parts[0],4)) {
		$title = $parts[1];
	}
	return $title;
}


function flickr_get_photo_width($id,$size) {
  $sizes=flickr_photo_sizes();
    $image_sizes = flickr_photo_get_sizes($id);
    $width = 200; // Set a default
    if ($image_sizes) {
      foreach ($image_sizes as $image_size) {
        if ($image_size['label'] == $sizes[$size]['label']) {
          $width = $image_size['width'];
          break;
        }
      }
    }
    return $width;
}

// Add javascript for preload
$toadd=path_to_theme() . '/jquery.preload/jquery.preload.js';
$js = drupal_add_js($toadd,'theme');
drupal_add_js(path_to_theme().'/jquery.preload/loadbigpics.js');
