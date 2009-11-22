  <div class="comment<?php if ($comment->status == COMMENT_NOT_PUBLISHED) print ' comment-unpublished'; ?>">
    <?php if ($picture) {
    print $picture;
  } ?>
  <div class="commentTitle"><?php print $title; ?></div>
    <div class="submitted"><?php print t('By ') . theme('username', $comment) . t(' - Posted on ') . format_date($comment->timestamp, 'custom', "F jS, Y"); ?></div> 
    <div class="commentContent"><?php print $content; ?></div>
      <?php if ($signature): ?>
          <div class="user-signature clear-block">
          <?php print $signature ?>
          </div>
      <?php endif; ?>
    <div class="links"> <?php print $links; ?></div>
  </div>
