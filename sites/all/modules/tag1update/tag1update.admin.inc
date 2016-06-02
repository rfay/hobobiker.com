<?php

/**
 * @file
 * Admin page callbacks for the tag1update module.
 */

/**
 * Settings form for module configuration.
 */
function tag1update_admin_settings() {
  $form['tag1update_report'] = array(
    '#type' => 'checkbox',
    '#title' => t('Report enabled module information to Tag1 Consulting, Inc'),
    '#description' => t('When checked, this module will send information about your enabled modules and themes to Tag1 Consulting as part of the D6 LTS service.'),
    '#default_value' => variable_get('tag1update_report', '1'),
  );
  $form['tag1update_token'] = array(
    '#type' => 'textfield',
    '#title' => t('Token'),
    '#description' => t('Your secure login token for the Tag1 Drupal LTS website.'),
    '#default_value' => variable_get('tag1update_token', ''),
    '#maxlength' => 255,
  );
  $form['advanced'] = array(
    '#type' => 'fieldset',
    '#title' => t('Advanced'),
    '#collapsible' => TRUE,
    '#collapsed' => !variable_get('tag1update_debug', FALSE),
  );
  $form['advanced']['tag1update_token'] = array(
    '#value' => '<div class="container-inline"><span class="option">' . t('Site identifier') . '</span><br /><span class="description">' . variable_get('tag1update_siteid', '') . '</span></div>',
  );
  $form['advanced']['tag1update_debug'] = array(
    '#type' => 'checkbox',
    '#title' => t('Debug logging'),
    '#description' => t('When checked, writes verbose watchdog logs for all communication attempts.'),
    '#default_value' => variable_get('tag1update_debug', FALSE),
  );

  $form['#submit'][] = 'tag1update_admin_settings_submit';
  return system_settings_form($form);
}

/**
 * Display the information that's being provided to Tag1 Consulting.
 */
function tag1update_admin_review() {
  $status = tag1update_get_status();

  if (empty($status['field_json_data'])) {
    $output = t('No information is currently being shared with Tag1 Consulting.');
  }
  else {
    $header = array(
      t('Name'),
      t('Type'),
      t('Version'),
      t('Schema version'),
      t('Enabled'),
      t('Filename'),
    );

    $rows = array();
    $enabled = $status['field_json_data'][0]['value'];
    foreach ($enabled as $project) {
      if (isset($project['info'])) {
        $info = unserialize($project['info']);
      }
      else {
        $info = array();
      }
      $row = array(
        $project['name'],
        $project['type'],
        isset($info['version']) ? $info['version'] : t('undefined'),
        $project['schema_version'],
        $project['status'],
        $project['filename'],
      );
      $rows[] = $row;
    }
    $output = theme('table', $header, $rows);

    $status['field_json_data'] = array(array('value' => tag1update_json_encode_helper($status['field_json_data'][0]['value'])));
    // Show the actual JSON that's being sent to Tag1 Consulting.
    $fieldset = array(
      '#title' => t('Raw data'),
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
      '#value' => '<div class="container-inline">' . tag1update_json_encode_helper($status) . '</div>',
    );
    $output .= theme('fieldset', $fieldset);

  }
  return $output;
}

/**
 * Current status of the information that's being provided to Tag1 Consulting.
 */
function tag1update_admin_status() {
  $output = '';
  $next_update = tag1update_next_update();
  if ($next_update <= 0) {
    $output .= '<p>' . t('A heartbeat will be sent to Tag1 the next time cron runs.');
  }
  else {
    $output .= '<p>' . t('A heartbeat will be sent to Tag1 in @time.', array('@time' => format_interval($next_update)));
  }
  $output .= '&nbsp;&nbsp;&nbsp;' . l(t('Send manually'), 'admin/settings/tag1updates/status/manual') . '</p>';

  $last_update = variable_get('tag1update_last_update', 0);
  if (!$last_update) {
    $output .= '<p>' . t('No heartbeat has ever been sent. Please be sure you have cron configured correctly.') . '</p>';
  }
  else {
    $time = time();
    $output .= '<p>' . t('The last heartbeat was sent @time ago.', array('@time' => format_interval($time - $last_update))) . '</p>';
    if (($time - $last_update) > TAG1UPDATE_HEARTBEAT_FREQUENCY * 2) {
      drupal_set_message(t('No recent heartbeat has been sent. Please be sure you have cron configured correctly.'), 'error');
    }
  }


  return $output;
}

/**
 * Manually send report to Tag1 Consulting.
 */
function tag1update_admin_send_manually() {
  $result = tag1update_send_report();
  if ($result->success) {
    drupal_set_message('Module status reported to Tag1 Consulting.');
  }
  else {
    drupal_set_message(t('Error %code: %message', array('%code' => isset($result->code) ? $result->code : 0, '%message' => $result->error)), 'error');
    drupal_set_message('Failed to report module status to Tag1 Consulting. Check the Drupal logs for more information.', 'error');
    watchdog('tag1update', t('Manual attempt failed.'), array(), WATCHDOG_INFO);
  }
  drupal_goto('admin/settings/tag1updates/status');
}
