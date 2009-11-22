<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="<?php echo get_page_language($language); ?>" xml:lang="<?php echo get_page_language($language); ?>">

<head>
  <title><?php if (isset($head_title )) { echo $head_title; } ?></title>
  <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7" />
  <?php echo $head; ?>  
  <?php echo $styles ?>
  <?php echo $scripts ?>
  <!--[if IE 6]><link rel="stylesheet" href="<?php echo $base_path . $directory; ?>/style.ie6.css" type="text/css" /><![endif]-->  
  <!--[if IE 7]><link rel="stylesheet" href="<?php echo $base_path . $directory; ?>/style.ie7.css" type="text/css" media="screen" /><![endif]-->
  <script type="text/javascript"><?php /* Needed to avoid Flash of Unstyle Content in IE */ ?> </script>
</head>

<body>
<div class="PageBackgroundSimpleGradient">
</div>
<div class="Main">
<div class="Sheet">
    <div class="Sheet-tl"></div>
    <div class="Sheet-tr"></div>
    <div class="Sheet-bl"></div>
    <div class="Sheet-br"></div>
    <div class="Sheet-tc"></div>
    <div class="Sheet-bc"></div>
    <div class="Sheet-cl"></div>
    <div class="Sheet-cr"></div>
    <div class="Sheet-cc"></div>
    <div class="Sheet-body">
<div class="Header">
    <div class="Header-png"></div>
    <div class="Header-jpeg"></div>
<div class="logo">
    <?php 
        if (!empty($site_name)) { echo '<h1 class="logo-name"><a href="'.check_url($base_path).'" title = "'.$site_name.'">'.$site_name.'</a></h1>'; }
        if (!empty($site_slogan)) { echo '<div class="logo-text">'.$site_slogan.'</div>'; }
        if (!empty($logo)) { echo '<div class="logo-image"><img src="'. check_url($logo) .'" alt="'. $site_title .'" id="logo-image" /></div>'; }
    ?>
 </div>

</div>
<?php if (!empty($navigation)): ?>
    <div class="nav">
	    <div class="l"></div>
	    <div class="r"></div>
	    <?php echo $navigation; ?>
    </div>
<?php endif; ?>
<?php if (!empty($banner1)) { echo $banner1; } ?>
<?php echo art_placeholders_output($top1, $top2, $top3); ?>
<div class="contentLayout">
<?php if (!empty($left)) echo '<div class="sidebar1">' . $left . "</div>"; 
else if (!empty($sidebar_left)) echo '<div class="sidebar1">' . $sidebar_left. "</div>";?>
<div class="<?php echo (!empty($left) || !empty($sidebar_left)) ? 'content' : 'content-wide'; ?>">
<?php if (!empty($breadcrumb) || !empty($tabs) || !empty($tabs2)): ?>
<div class="Post">
    <div class="Post-body">
<div class="Post-inner">
<div class="PostContent">
<?php if (!empty($breadcrumb)) { echo theme('breadcrumb', $breadcrumb); } ?>
<?php if (!empty($tabs)) { echo $tabs.'<div class="cleared"></div>'; }; ?>
<?php if (!empty($tabs2)) { echo '<ul class="tabs secondary">'. $tabs2 .'</ul>'; } ?>
<?php if (!empty($banner2)) { echo $banner2; } ?>
<?php if ((!empty($user1)) && (!empty($user2))) : ?>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr valign="top"><td width="50%"><?php echo $user1; ?></td>
<td><?php echo $user2; ?></td></tr>
</table>
<?php else: ?>
<?php if (!empty($user1)) { echo '<div id="user1">'.$user1.'</div>'; }?>
<?php if (!empty($user2)) { echo '<div id="user2">'.$user2.'</div>'; }?>
<?php endif; ?>
<?php if (!empty($banner3)) { echo $banner3; } ?>

</div>
<div class="cleared"></div>

</div>

    </div>
</div>
<?php endif; ?>
<?php if (!empty($mission)) { echo '<div id="mission">'.$mission.'</div>'; }; ?>
<?php if (!empty($help)) { echo $help; } ?>
<?php if (!empty($messages)) { echo $messages; } ?>
<?php echo art_content_replace($content); ?>
<?php if (!empty($banner4)) { echo $banner4; } ?>
<?php if (!empty($user3) && !empty($user4)) : ?>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr valign="top"><td width="50%"><?php echo $user3; ?></td>
<td><?php echo $user4; ?></td></tr>
</table>
<?php else: ?>
<?php if (!empty($user3)) { echo '<div id="user1">'.$user3.'</div>'; }?>
<?php if (!empty($user4)) { echo '<div id="user2">'.$user4.'</div>'; }?>
<?php endif; ?>
<?php if (!empty($banner5)) { echo $banner5; } ?>
</div>

</div>
<div class="cleared"></div>
<?php echo art_placeholders_output($bottom1, $bottom2, $bottom3); ?>
<?php if (!empty($banner6)) { echo $banner6; } ?>
<div class="Footer">
    <div class="Footer-inner">
        <a href="<?php $feedsUrls = array_keys(drupal_add_feed()); if(isset($feedsUrls[0]) && strlen($feedsUrls[0])>0) {echo $feedsUrls[0];} ?>" class="rss-tag-icon" title="RSS"></a>
        <div class="Footer-text">
        <?php 
            if (!empty($footer_message) && (trim($footer_message) != "")) { 
                echo $footer_message;
            }
            else {
                echo '<p><a href="#">Contact Us</a>&nbsp;|&nbsp;<a href="#">Terms of Use</a>&nbsp;|&nbsp;<a href="#">Trademarks</a>&nbsp;|&nbsp;<a href="#">Privacy Statement</a><br />'.
                     'Copyright &copy; 2009&nbsp;'.$site_name.'.&nbsp;All Rights Reserved.</p>';
            }
        ?>
        <?php if (!empty($copyright)) { echo $copyright; } ?>
        </div>        
    </div>
    <div class="Footer-background"></div>
</div>

    </div>
</div>
<div class="cleared"></div>
<p class="page-footer"><?php echo t('Powered by ').'<a href="http://drupal.org/">'.t('Drupal').'</a>'.t(' and ').'<a href="http://www.artisteer.com/?p=drupal_themes">Drupal Theme</a>'.t(' created with ').'Artisteer'; ?>.</p>
</div>


<?php print $closure; ?>

</body>
</html>
