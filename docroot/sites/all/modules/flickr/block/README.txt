NAME
====
Flickr Block
Part of the Flickr module. Project page at https://drupal.org/project/flickr

OVERVIEW
========
Flickr images in blocks to show for example recent or random images from a
specific user, set or group.

- Configure the size, media type (photo/video) and number of images to show.
- With visibility by role or path.
- Blocks can be placed in any theme region.

There are three blocks that appear only on user profile pages and show the
Flickr photos of the corresponding user.
- User profile page recent Flickr photos
- User profile page recent Flickr photosets
- User profile page random Flickr photos

The block visibility setting for 'user' blocks are not only restricted by the
user in the block configuration but also by the module. The block gets displayed
when the first argument of the path is 'user' and a specific uid is available.
This is however not visible for the web admin and confusing.
See issue #1122564: Sync the module defined visibility setting with the block
configuration. In the future these blocks will probably move to a dedicated
Flickr Profile sub-module.

Furthermore nine site wide blocks are available. A user, photoset or group needs
to be specified in the block configuration.
- Recent photos from a Flickr user
- Recent photosets from a Flickr user
- Random photos from a Flickr user
- Recent photosfrom a Flickr group
- Random photos from a Flickr photoset
- Recent photos from a Flickr photoset
- Favorite public photos from a Flickr user
- Random photos from a Flickr group
- Random photos with a specific tag from a Flickr user

BLOCK CONFIGURATION
===================

Fields in the block settings that apply on all blocks.

Show n photos
-------------
The block will display this many photos.

Size of photos
--------------
Select the size of photos you'd like to display in the block.
NOTE:
For square images ('s': 75px and 'q': 150px) no real width needs to be fetched,
giving it a performance advantage over other sizes. Recommended if you include
many images.


All blocks except 'User profile recent photosets' and 'Recent photosets from
user'.

Media type
----------
- photos
- videos
Note that for videos only an image representing the video is showed.


All '..from user' blocks.

Flickr User ID
--------------
A valid Flickr User ID, username or email address. If this is left blank, the
sites's default user will be used if set.
Emails or usernames (that might change at any given time) are internally (in the
variable) replaced with a stable NSID (Flickr ID number). These are rendered in
this field as Flickr usernames. 'Maria Emanuela' is human readable,
'43937662@N05' is not. Internal the module still uses the Flickr ID number as it
is more reliable.


Other fields are self-explaining.
