<?php
// $Id: color.inc,v 1.2 2008/04/24 12:58:59 pixture Exp $

$info = array(

  // Pre-defined color schemes
  'schemes' => array(
	// base, link, gradation(top), gradation(bottom), text
    '#165eac,#525062,#030303,#555555,#666666' => t('Bkack/Blue (Default)'),
    '#a74242,#625051,#030303,#555555,#666666' => t('Bkack/Red'),
    '#d77e09,#614838,#030303,#555555,#666666' => t('Bkack/Orange'),
    '#9db625,#5c6250,#030303,#555555,#666666' => t('Bkack/Green'),
    '#7e8d44,#676737,#030303,#555555,#666666' => t('Black/Wasabi'),
    '#b49e1d,#625550,#030303,#555555,#666666' => t('Bkack/Mustard'),
    '#8551cd,#4b4261,#030303,#555555,#666666' => t('Bkack/Purple'),
    '#6a657b,#605b7b,#030303,#555555,#666666' => t('Black/Graphite'),
	'#67553c,#5e3926,#141a0f,#607e4e,#666666' => t('Mos Green'),
	'#a08240,#634627,#0b0804,#8d5e20,#666666' => t('Espresso'),
    '#6f6452,#73305b,#14000a,#975979,#666666' => t('Azuki'),
    '#655648,#6c4333,#0d0f06,#6c7042,#666666' => t('Autum'),
    '#546064,#4a5c78,#010609,#447583,#666666' => t('Deep Ocean'),
	'#465537,#7a3d2e,#440000,#b14928,#666666' => t('Wabi'),
  ),

  // Images to copy over
  'copy' => array(
    'images/button.gif',
    'images/button-o.gif',
  ),

  // CSS files (excluding @import) to rewrite with new color scheme.
  // NOTE: this is new to Drupal 6.x
  'css' => array(
    'style.css',
  ),

  // Coordinates of gradient (x, y, width, height)
  'gradient' => array(0, 0, 800, 111),

  // Color areas to fill (x, y, width, height)
  'fill' => array(
    'base' => array(0, 112, 800, 460),
    'link' => array(0, 572, 800,   8),	// dummy (not used)
  ),

  // Coordinates of all the theme slices (x, y, width, height)
  // with their filename as used in the stylesheet.
  'slices' => array(
	'images/bg-wall.png'		=> array(  0, 112,   8,   8),
	'images/bg-header.png'		=> array(  0,   0,   8, 112),

	'images/bg-menu.png'        => array( 41,  80,  10,  32),
	'images/bg-menu-l.png'      => array( 31,  80,  10,  32),
	'images/bg-menu-r.png'      => array(759,  80,  10,  32),

	'images/bg-main-l.png'      => array( 31, 112,  10,  10),
	'images/bg-main-r.png'      => array(759, 112,  10,  10),

	'images/bg-foot.png'        => array(100, 549,  10,  10),
	'images/bg-foot-l.png'      => array( 31, 549,  10,  10),
	'images/bg-foot-r.png'      => array(759, 549,  10,  10),

	'images/bg-sidebar.png'     => array( 54, 122, 194,  28),
	'images/bg-title-l.png'     => array(269, 129,  30,  34),
	'images/bg-title-c.png'     => array(400, 129,  10,  34),
	'images/bg-title-r.png'     => array(714, 129,  30,  34),

	'images/bg-node-tl.png'     => array(270, 182,  14,  12),
	'images/bg-node-tc.png'     => array(300, 182,  12,  12),
	'images/bg-node-tr.png'     => array(728, 182,  14,  12),
	'images/bg-node-ml.png'     => array(270, 200,  14,  14),
	'images/bg-node-mr.png'     => array(728, 200,  14,  14),
	'images/bg-node-bl.png'     => array(270, 386,  14,  12),
	'images/bg-node-bc.png'     => array(300, 386,  12,  12),
	'images/bg-node-br.png'     => array(728, 386,  14,  12),

	'images/bg-divider-l.png'   => array(270, 423,  14,  12),
	'images/bg-divider-c.png'   => array(300, 423,  14,  12),
	'images/bg-divider-r.png'   => array(728, 423,  14,  12),

    'images/bg-gbar.png'        => array(770,  72,  10,  40),
    'images/bg-gbar-lite.png'   => array(780,  72,  10,  40),

    'images/bg-bar.png'         => array(770, 112,  10,  40),
    'images/bg-bar-lite.png'    => array(780, 112,  10,  40),

    'screenshot.png'            => array(  0,  20, 800, 480),
  ),

  // Reference color used for blending. Matches the base.png's colors.
  'blend_target' => '#ffffff',

  // Preview files
  'preview_image' => 'color/preview.png',
  'preview_css' => 'color/preview.css',

  // Base file for image generation
  'base_image' => 'color/base.png',
);
