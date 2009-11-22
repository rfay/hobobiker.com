<div class="Post">
    <div class="Post-body">
<div class="Post-inner">
    
	<div class="comment<?php if ($comment->status == COMMENT_NOT_PUBLISHED) echo ' comment-unpublished'; ?>">
<h2 class="PostHeaderIcon-wrapper"> <span class="PostHeader">
			<?php if ($picture) {echo $picture; } ?>
				<?php if ($title) {echo $title; } ?>
				<?php if ($new != '') { ?><?php echo $new; ?><?php } ?>
</span>
		</h2>
		
		<?php if ($submitted): ?>
			<div class="submitted"><?php echo $submitted; ?></div>
			<div class="cleared"></div><br/>
		<?php endif; ?>	
<div class="PostContent">
		
			<?php echo $content; ?>

		</div>
		<div class="cleared"></div>
		
		<div class="links"><?php echo $links; ?><div class="cleared"></div></div>	
	</div>

</div>

    </div>
</div>
