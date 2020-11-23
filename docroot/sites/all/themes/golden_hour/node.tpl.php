  <div class="node<?php if ($sticky) { print " sticky"; } ?><?php if (!$status) { print " node-unpublished"; } ?>">
    <?php if ($picture) {
      print $picture;
    }?>
    <?php if ($page == 0) { ?><h2 class="nodeTitle"><a href="<?php print $node_url?>"><?php print $title?></a></h2><?php }; ?>
    <?php if ($submitted): ?>
      <div class="submitted"><?php print t('By ') . theme('username', $node) . t(' - Posted on ') . format_date($node->created, 'custom', "F jS, Y"); ?></div> 
    <?php endif; ?>
    <?php if ($terms) { ?><div class="taxonomy">Tagged: <?php print $terms ?></div><?php }; ?>
    <div class="nodeContent"><?php print $content?></div>
    <?php if ($links) { ?><div class="nodeLinks"><?php print $links?></div><?php }; ?>
  </div>
