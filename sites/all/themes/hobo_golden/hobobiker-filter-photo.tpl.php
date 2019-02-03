<?php

/**
 * @file
 *
 * Available variables:
 * - $path // full path to full size original image
 * - $orientation // portrait or landscape, default to landxape
 * - $caption
 *
 * Note that ALT and Title fields should not be filled in here, instead they
 * should use placeholders that will be updated through JavaScript when the
 * image is inserted.
 *
 * Available placeholders:
 * - __alt__: The ALT text, intended for use in the <img> tag.
 * - __title__: The Title text, intended for use in the <img> tag.
 * - __description__: A description of the image, sometimes used as a caption.
 */

$rel = "lightbox[group1][" . $caption . "]";
// Todo: Make preset configurable
$preset='240x180';
if ($orientation == "portrait") {
  $preset= '180x240';
}
$markup = theme('imagecache', $preset, $path, $caption, $caption, ["rel" => $rel], FALSE);

?>
<div class="flickrfloat"><div class="flickr-img-wrapper">
        <a rel="lightbox[group1][<?php print $caption ?>]" href="/<?php print $path ?>">
        <?php print $markup ?>
        </a>
        </div>
</div>
