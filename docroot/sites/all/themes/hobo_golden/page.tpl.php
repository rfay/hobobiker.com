<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="<?php print $language->language ?>" xml:lang="<?php print $language->language ?>">


<head>
  <title><?php print $head_title ?></title>
  <?php print $head ?>
  <?php print $styles ?>
  <?php print $scripts ?>
</head>

<body>

  <!--Wrapper-->
  <div id="wrapper">

    <!-- Header -->
    <div id="header">

	<?php if ($logo) : ?>
          <div id="logo">
	    <a href="<?php print $base_path ?>" title="<?php print t('Home') ?>">
	      <img src="<?php print $logo ?>" alt="<?php print t('Home') ?>" /></a>
	  </div>
	<?php endif ?>

	<?php if ($site_name): ?>
          <h1>
	    <a href="<?php print $base_path ?>" title="<?php print t('Home') ?>">
	      <?php print $site_name ?>
	    </a>
	  </h1>
	<?php endif; ?>

	<?php if ($site_slogan): ?>
	  <h2>
	    <?php print $site_slogan ?>
	  </h2>
	<?php endif; ?>

    </div><!--End of Header -->

	<!--Menu -->
	<nav id="main-nav" class="main-nav">
	  <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="main-nav-menu">
	    <span class="nav-toggle-icon"></span>
	    <span class="nav-toggle-label"><?php print t('Menu') ?></span>
	  </button>
	  <?php print hobo_golden_nav_menu() ?>
	</nav><!-- End of Menu -->

	<!--Content-->
	<div id="content" style="width: <?php print golden_hour_get_primaryContent_width($sidebar_left) ?>%;">

	<?php if ($mission) : ?><div class="mission"><?php print $mission ?></div><?php endif ?>
	<?php if ($breadcrumb) : ?><div class="breadcrumb"><?php print $breadcrumb ?></div><?php endif ?>
	<?php if ($title != "") : ?><h2 class="pageTitle"><?php print $title ?></h2><?php endif ?>
	<?php if ($tabs) : ?><div class="tabs"><?php print $tabs ?></div><?php endif ?>
	<?php if ($help) : ?><div class="help"><?php print $help ?></div><?php endif ?>
	<?php if ($messages) : ?><div class="messages"><?php print $messages ?></div><?php endif ?>
	<?php print $content_top; ?>
	<?php print $content; ?>
	<?php print $content_bottom; ?>
	<?php print $feed_icons; ?>

	</div><!-- End of Content -->

	<!-- Sidebar -->
	<?php if ($sidebar_left) : ?>
	  <div id="sidebar">
	  <?php if ($search_box) : ?>
	      <?php print $search_box ?>
	  <?php endif; ?>
	    <?php print $sidebar_left ?>
	  </div><!-- End of Sidebar -->
	<?php endif ?>

	<!-- Footer -->
	<div id="footer">
	  <p><?php print $footer_message; ?></p>
	</div><!-- End of footer -->

	<?php print $closure; ?>

  </div><!-- End of wrapper -->

</body>
</html>
