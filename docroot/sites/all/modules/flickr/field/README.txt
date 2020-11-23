NAME
====
Flickr Field
Part of the Flickr module. Project page at https://drupal.org/project/flickr

OVERVIEW
========
Add Flickr images or sets to content as fields:
- can be added to entities, usually nodes
- have several formatting options to use various sizes
- can be queried with the Views module.
There are two kind of module provided Flickr fields. Only the first type is used
for single Flickr photos. Both type of fields can be used for Flickr Photo Sets
but each in a different way.

Flickr Photo
------------
Store Flickr Photo or Photoset IDs and display the photos in nodes and Views. It
displays all images of a Flickr Photo Set and links to the individual Flickr
Photo pages. The sub-module Flickr Sets should be enabled to use sets in this
field.

Flickr Photo Set
----------------
Field for storing a reference to a Flickr photo set. It displays only the
primary reprensenting image of a set and links to the Flickr Photo Set page.

FIELD CONFIGURATION
===================
- Go to '/admin/content/types'
- Click 'manage fields'
- Add new field > Flickr Photo or Flickr Photo Set (sub-module Flickr Sets should be enabled to use sets in this field)
- Configure as desired
- Save settings
Then:
- Go to '/admin/content/node-type/[node-type]/fields'
- Click 'Display fields'
- Select the formatter for a Flickr field (a size or Flash slideshow)
- Save

NOTE:
For square images ('s': 75px and 'q': 150px) no real width needs to be fetched,
giving it a performance advantage over other sizes. Recommended if you include
many images.
