<?php 
// $Id: template.php,v 1.9.2.1.2.2 2007/04/10 01:50:46 jwolf Exp $
// regions for goldenhour
function golden_hour_regions() {
    return array(
        'left' => t('left sidebar'),
        'content_top' => t('content top'),
	'content_bottom' => t('content bottom')
    );
}
// resizes the main content according to the presence or absence of the side bar
function golden_hour_get_primaryContent_width($sidebar_left) {
  $width = 66;
  if (!$sidebar_left) {
    $width = $width + 30;
  }  
  if ($sidebar_left) {
    $width = $width + 6;
  }
  return $width;
}
// set $links delimiter and classes to each link
function golden_hour_links($links, $attributes = array('class' => 'links')) {
  $output = '';

  if (count($links) > 0) {

    $num_links = count($links);
    $i = 1;

    foreach ($links as $key => $link) {
      $class = '';

      // Automatically add a class to each link and also to each LI
      if (isset($link['attributes']) && isset($link['attributes']['class'])) {
        $link['attributes']['class'] .= ' ' . $key;
        $class = $key;
      }
      else {
        $link['attributes']['class'] = $key;
        $class = $key;
      }

      // Add first and last classes to the list of links to help out themers.
      $extra_class = '';
      if ($i == 1) {
        $extra_class .= 'first ';
      } else {
        $output .= '&nbsp;&bull; &nbsp;';
      }
      if ($i == $num_links) {
        $extra_class .= 'last ';
      }
      $output .= '<span class="'. $extra_class . $class .'">';

      // Is the title HTML?
      $html = isset($link['html']) && $link['html'];

      // Initialize fragment and query variables.
      $link['query'] = isset($link['query']) ? $link['query'] : NULL;
      $link['fragment'] = isset($link['fragment']) ? $link['fragment'] : NULL;

      if (isset($link['href'])) {
        $output .= l($link['title'], $link['href'], array('attributes' => $link['attributes'], 'query' =>$link['query'], 'fragment' => $link['fragment'], 'absolute' => FALSE, 'html' => $html));
      }
      else if ($link['title']) {
        //Some links are actually not links, but we wrap these in <span> for adding title and class attributes
        if (!$html) {
          $link['title'] = check_plain($link['title']);
        }
        $output .= '<span'. drupal_attributes($link['attributes']) .'>'. $link['title'] .'</span>';
      }

      $i++;
      $output .= "</span>\n";
    }

  }

  return $output;
}



/**
 * Returns the themed HTML for primary and secondary links.
 * From drupal5 menu.inc
 *
 * @param $links
 *   An array containing links to render.
 * @return
 *   A string containing the themed links.
 *
 * @ingroup themeable
 */
function golden_hour_menu_links($links) {
  if (!count($links)) {
    return '';
  }
  $level_tmp = explode('-', key($links));
  $level = $level_tmp[0];
  $output = "<ul class=\"links-$level\">\n";
  foreach ($links as $index => $link) {
    $output .= '<li';
    if (stristr($index, 'active')) {
      $output .= ' class="active"';
    }
    $output .= ">". l($link['title'], $link['href'], array('attributes'=> array($link['attributes'], 'query'=>$link['query'], 'fragment'=> $link['fragment']))) ."</li>\n";
  }
  $output .= '</ul>';

  return $output;
}

