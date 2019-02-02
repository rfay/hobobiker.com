NAME
====
Hobobiker Filter
Part of the Hobobiker module. Project page at https://drupal.org/project/hobobiker

OVERVIEW
========
Include single Hobobiker images or sets into the node body using only the Hobobiker ID
and optionally a size parameter.

FILTER CONFIGURATION
====================
The Hobobiker filter (called 'Hobobiker linker') should be added first to a text
format at '/admin/config/content/formats' > configure
In the 'Filter processing order' it should be placed above filters that affect
image related HTML, for example AutoFloat
(https://drupal.org/project/autofloat).

FILTER SYNTAX
=============
The filter format is: [hobobiker-photo:id=230452326,size=s] and
[hobobiker-photoset:id=72157594262419167,size=m]
You find the ID within the URL of the Hobobiker Photo or Set page. Note the length
of the number to distinguish a photo ID from a set ID. A number that includes
'@' is a user or group ID that can not be used in the filter.

The size parameter can be one of the following
(if available, check on Hobobiker > Actions > View all sizes"):
  s - small square 75x75
  t - thumbnail, 100 on longest side
  q - big square 150x150
  m - small, 240 on longest side
  n - small, 320 on longest side
  - - medium, 500 on longest side
  z - medium, 640 on longest side
  c - medium, 800 on longest side
  b - large, 1024 on longest side
  h - large, 1600 on longest side
  k - large, 2048 on longest side
  o - original image

NOTE:
For square images ('s': 75px and 'q': 150px) no real width needs to be fetched,
giving it a performance advantage over other sizes. Recommended if you include
many images.

A default size can be specified on the Hobobiker settings page at
'/admin/settings/hobobiker'. This size gets used in case the size parameter is
omitted, for example [hobobiker-photo:id=230452326]. It also means you can change
the size of all images without a specified size on the site in one go.

More info at http://www.hobobiker.com/help/faq/search/?q=sizes

Adding a class or style value
-----------------------------
To pass classes or styles the syntax has to look like:
[hobobiker-photo:id=9247386562, size=m, class=foo bar, style=float:left;]
Thus without quotes.
Try to avoid inline styling to float your images. Use the AutoFloat module
instead (https://drupal.org/project/autofloat) or use a custom class
and target it with CSS.
