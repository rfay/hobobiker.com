<?php

/**
 * Implements hook_settings().
 */
function flickr_admin_settings() {
  $form['flickr_api_key'] = array(
    '#type' => 'textfield',
    '#title' => t('API Key'),
    '#required' => TRUE,
    '#default_value' => variable_get('flickr_api_key', ''),
    '#description' => t('API Key from Flickr'),
  );
  $form['flickr_api_secret'] = array(
    '#type' => 'textfield',
    '#title' => t('API Shared Secret'),
    '#required' => TRUE,
    '#default_value' => variable_get('flickr_api_secret', ''),
    '#description' => t("API key's secret from Flickr."),
  );
  $default = variable_get('flickr_default_userid', '');
  if (!empty($default)) {
    $info = flickr_people_get_info($default);
    $default = $info['username']['_content'];
  }
  $form['flickr_default_userid'] = array(
    '#type' => 'textfield',
    '#title' => t('Default Flickr User Id'),
    '#default_value' => $default,
    '#description' => t('An, optional, default Flickr user (ID number, username or email). This will be used when no user is specified.'),
  );
  $times = array(
    900,
    1800,
    2700,
    3600,
    7200,
    10800,
    14400,
    18000,
    21600,
    43200,
    86400,
  );
  $ageoptions = drupal_map_assoc($times, 'format_interval');
  $form['flickr_cache_duration'] = array(
    '#type' => 'select',
    '#title' => t('Update interval'),
    '#options' => $ageoptions,
    '#default_value' => variable_get('flickr_cache_duration', 3600),
    '#description' => t("The refresh interval indicating how often you want to check cached Flickr API calls are up to date."),
  );
  $form['flickr_photos_per_page'] = array(
    '#type' => 'textfield',
    '#title' => t('Number of photos per photoset'),
    '#required' => TRUE,
    '#default_value' => variable_get('flickr_photos_per_page', '30'),
    '#description' => t('The number indicates how many photos of a photoset display in your nodes. After saving the configuration <a href="?q=admin/settings/performance">clear the cache</a>.'),
    '#size' => 3,
    '#maxlength' => 3,
  );
  if (module_exists('flickr_filter')) {
    $form['flickr_default_size'] = array(
      '#type' => 'select',
      '#title' => t('Default size'),
      '#default_value' => variable_get('flickr_default_size', 'm'),
      '#options' => array(
        's' => t('s: 75 px square'),
        't' => t('t: 100 px on longest side'),
        'q' => t('q: 150 px square'),
        'm' => t('m: 240 px on longest side'),
        'n' => t('n: 320 px on longest side (!)'),
        '-' => t('-: 500 px on longest side'),
        'z' => t('z: 640 px on longest side'),
        'c' => t('c: 800 px on longest side (!)'),
        'b' => t('b: 1024 px on longest side'),
      ),
      '#description' => t('A default Flickr size to use. This will be used when no size is specified, for example [flickr-photo:id=3711935987].<br />After saving the configuration, <a href="?q=admin/settings/performance">clear the cache</a>.<br />!: TAKE CARE, n (320px) and c (800px) sizes are missing on many "older" Flickr images!'),
    );
  }
  $form['flickr_css'] = array(
    '#type' => 'checkbox',
    '#title' => t('Use flickr.css'),
    '#default_value' => variable_get('flickr_css', 1),
    '#description' => t('Uncheck to take care of the styling yourself in custom CSS.'),
  );
  $form['info_settings'] = array(
    '#type' => 'fieldset',
    '#title' => t('Flickr info to use'),
  );
  $form['info_settings']['flickr_title_suppress_on_small'] = array(
    '#type' => 'textfield',
    '#title' => t('Minimum image width to display a title caption.'),
    '#required' => TRUE,
    '#default_value' => variable_get('flickr_title_suppress_on_small', '100'),
    '#description' => t('Small images have liitle space for a title caption. Replace it with the text "Flickr" that links to the photo page on Flickr to comply with their <a href="https://www.flickr.com/guidelines.gne" title="Flickr Community Guidelines">Guidelines</a>.<br />After saving the configuration <a href="?q=admin/config/development/performance">clear the cache</a>.'),
    '#field_suffix' => t('px'),
    '#size' => 3,
    '#maxlength' => 3,
  );
  $form['info_settings']['flickr_metadata_suppress_on_small'] = array(
    '#type' => 'textfield',
    '#title' => t('Minimum image width to display date, location and photographer under the caption.'),
    '#required' => TRUE,
    '#default_value' => variable_get('flickr_metadata_suppress_on_small', '150'),
    '#description' => t('Suppress extra info on small images. After saving the configuration <a href="?q=admin/config/development/performance">clear the cache</a>.'),
    '#field_suffix' => t('px'),
    '#size' => 3,
    '#maxlength' => 3,
  );
  $form['info_settings']['flickr_caption_padding'] = array(
    '#type' => 'textfield',
    '#title' => t('Make the caption smaller in width'),
    '#required' => TRUE,
    '#default_value' => variable_get('flickr_caption_padding', '0'),
    '#description' => t('By default the caption is as width as the image. Set a value here to make sure the caption will remain of the same width of the image when you add a padding to a boxed caption. See <a href="https://drupal.org/node/2174131#caption" title="Flickr module documentation on Drupal.org" target="_blank">Style Guide</a>.'),
    '#field_suffix' => t('px'),
    '#size' => 2,
    '#maxlength' => 2,
  );
  $form['info_settings']['flickr_info_overlay'] = array(
    '#type' => 'checkboxes',
    '#title' => t('Info to include when enlarging the image'),
    '#default_value' => variable_get('flickr_info_overlay', array(
      'title' => 'title',
      'metadata' => 'metadata',
      'description' => 'description',
    )),
    '#options' => array(
      'title' => t('Title'),
      'metadata' => t('Date, location and photographer'),
      'description' => t('Description'),
    ),
  );
  $form['overlay_settings'] = array(
    '#type' => 'fieldset',
    '#title' => t('Overlay browser settings'),
    '#description' => t('Leave empty to link directly to the Flickr photo page instead of opening the bigger version of the image.'),
  );
  $form['overlay_settings']['flickr_class'] = array(
    '#type' => 'textfield',
    '#title' => t('class'),
    '#default_value' => variable_get('flickr_class', ''),
    '#description' => t('For example: <em>colorbox</em>'),
  );
  $form['overlay_settings']['flickr_rel'] = array(
    '#type' => 'textfield',
    '#title' => t('rel'),
    '#default_value' => variable_get('flickr_rel', ''),
    '#description' => t('For example: <em>gallery-all</em> or <em>lightbox[gallery]</em>'),
  );
  $form['overlay_settings']['flickr_opening_size'] = array(
    '#type' => 'select',
    '#title' => t('Image size to open'),
    '#default_value' => variable_get('flickr_opening_size', ''),
    '#options' => array(
      'm' => t('m: 240 px on longest side'),
      'n' => t('n: 320 px on longest side (!)'),
      '' => t('-: 500 px on longest side'),
      'z' => t('z: 640 px on longest side'),
      'c' => t('c: 800 px on longest side (!)'),
      'b' => t('b: 1024 px on longest side'),
    ),
    '#description' => t('The image size to open in the overlay browser when clicking the image. Larger sizes make navigating to next and previous pictures slower.<br />After saving the configuration, <a href="?q=admin/config/development/performance">clear the cache</a>.<br />!: TAKE CARE, n (320px) and c (800px) sizes are missing on many "older" Flickr images!'),
  );
  // We need an api key before we can verify usernames.
  if (!$form['flickr_api_key']['#default_value']) {
    $form['flickr_default_userid']['#disabled'] = TRUE;
    $form['flickr_default_userid']['#description'] .= ' ' . t('Disabled until a valid API Key is set.');
  }

  // Add a submit handler before the system_settings_form submit handler.
  $form['#submit'] = array('flickr_admin_settings_submit');

  return system_settings_form($form);
}

function flickr_admin_settings_validate($form, &$form_state) {
  $key = trim($form_state['values']['flickr_api_key']);
  $sec = trim($form_state['values']['flickr_api_secret']);
  $uid = trim($form_state['values']['flickr_default_userid']);
  $limit1 = trim($form_state['values']['flickr_photos_per_page']);
  $limit2 = trim($form_state['values']['flickr_title_suppress_on_small']);
  $limit3 = trim($form_state['values']['flickr_metadata_suppress_on_small']);
  $limit4 = trim($form_state['values']['flickr_caption_padding']);
  if (!is_numeric($limit1) || $limit1 < 1) {
    form_set_error('flickr_photos_per_page', t('Set a number from 1 to 999.'));
  }
  // Validate the minimum width to suppress title caption.
  if (!is_numeric($limit2) || $limit2 < 0) {
    form_set_error('flickr_title_suppress_on_small', t('Set a width from 0 to 999 px.'));
  }
  if ($key && (preg_match('/^[A-Fa-f\d]{32}$/', $key) != 1)) {
    form_set_error('flickr_api_key', t('This does not appear to be a Flickr API key.'));
  }
  if ($sec && (preg_match('/^[A-Fa-f\d]{16}$/', $sec) != 1)) {
    form_set_error('flickr_api_secret', t('This does not appear to be a Flickr API secret.'));
  }
  if ($uid) {
    $user = flickr_user_find_by_identifier($uid);
    if (!$user) {
      form_set_error('flickr_default_userid', t('%uid does not appear to be a valid Flickr user.', array('%uid' => $uid)));
    }
  }
  // Validate the number of photos.
  if (!is_numeric($limit1) || $limit1 < 1) {
    form_set_error('flickr_photos_per_page', t('Set a number from 1 to 999.'));
  }
  // Validate the minimum width to suppress title caption.
  if (!is_numeric($limit2) || $limit2 < 0) {
    form_set_error('flickr_title_suppress_on_small', t('Set a width from 0 to 999 px.'));
  }
  // Validate the minimum width to suppress metadata caption.
  if (!is_numeric($limit2) || $limit3 < 0) {
    form_set_error('flickr_metadata_suppress_on_small', t('Set a width from 0 to 999 px.'));
  }
  // Validate the minimum width to suppress metadata caption.
  if (!is_numeric($limit4) || $limit4 < 0) {
    form_set_error('flickr_caption_padding', t('Set a padding from 0 to 99 px.'));
  }
}

function flickr_admin_settings_submit($form, &$form_state) {
  // Clean up the data.
  $form_state['values']['flickr_api_key'] = trim($form_state['values']['flickr_api_key']);
  $form_state['values']['flickr_api_secret'] = trim($form_state['values']['flickr_api_secret']);
  $form_state['values']['flickr_photos_per_page'] = trim($form_state['values']['flickr_photos_per_page']);
  $form_state['values']['flickr_default_userid'] = trim($form_state['values']['flickr_default_userid']);

  // Replace the usernames with a user id.
  // As emails or usernames might change, replace them with a unique nsid.
  if (!flickr_is_nsid($form_state['values']['flickr_default_userid'])) {
    $userid = $form_state['values']['flickr_default_userid'];
    if (empty($userid)) {
      return;
    }
    if ($user = flickr_user_find_by_identifier($userid)) {
      drupal_set_message(t("The Flickr user associated with '%userid' has internally been replaced with the corresponding Flickr ID '%uid'.", array('%userid' => $form_state['values']['flickr_default_userid'], '%uid' => $user)));
      $form_state['values']['flickr_default_userid'] = $user;
    }
  }
  else {
    $info = flickr_people_get_info($form_state['values']['flickr_default_userid']);
    drupal_set_message(t("The Flickr user associated with '%uid' will be shown to you as Flickr user '%userid'.", array('%uid' => $form_state['values']['flickr_default_userid'], '%userid' => $info['username']['_content'])));
  }
}
