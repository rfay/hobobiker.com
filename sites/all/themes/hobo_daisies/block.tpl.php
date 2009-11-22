<div class="Block">
    <div class="Block-body">

	<?php if ($block->subject): ?>
<div class="BlockHeader">
		    <div class="l"></div>
		    <div class="r"></div>
		    <div class="header-tag-icon">
		        <div class="t">	
			<?php echo $block->subject; ?>
</div>
		    </div>
		</div>    
	<?php endif; ?>		
<div class="BlockContent">
	    <div class="BlockContent-tl"></div>
	    <div class="BlockContent-tr"></div>
	    <div class="BlockContent-bl"></div>
	    <div class="BlockContent-br"></div>
	    <div class="BlockContent-tc"></div>
	    <div class="BlockContent-bc"></div>
	    <div class="BlockContent-cl"></div>
	    <div class="BlockContent-cr"></div>
	    <div class="BlockContent-cc"></div>
	    <div class="BlockContent-body">
	  
		<?php echo $block->content; ?>

	    </div>
	</div>
	

    </div>
</div>
