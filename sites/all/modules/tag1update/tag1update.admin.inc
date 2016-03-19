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
  $form['tag1update_url'] = array(
    '#type' => 'textfield',
    '#title' => t('Reporting URL'),
    '#description' => t('The URL where information will be sent.'),
    '#default_value' => variable_get('tag1update_url', TAG1UPDATE_DEFAULT_URL),
    '#maxlength' => 255,
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
  tag1update_update_status();
  $status = tag1update_get_status();

  if (empty($status['field_json_data'])) {
    $output = t('No information is currently being shared with Tag1 Consulting.');
  }
  else {
    $header = array(
      t('Name'),
      t('Type'),
      t('Display name'),
      t('Package'),
      t('Version'),
      t('Schema version'),
    );

    $rows = array();
    $enabled = $status['field_json_data'][0]['value'];
    foreach ($enabled as $project) {
      $row = array(
        $project['name'],
        $project['type'],
        $project['info_name'],
        $project['info_package'],
        $project['info_version'],
        $project['schema_version'],
      );
      $rows[] = $row;
    }
    $output = theme('table', $header, $rows);

    // Show the actual JSON that's being sent to Tag1 Consulting.
    $fieldset = array(
      '#title' => t('Raw data'),
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
      '#value' => '<div class="container-inline">' . drupal_to_js($status) . '</div>',
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

  if (variable_get('tag1update_update', FALSE)) {
    $output .= '<p>' . t('Changes to report.') . '</p>';
    $report_type = t('change report');
  }
  else {
    $output .= '<p>' . t('No changes to report.') . '</p>';
    $report_type = t('heartbeat');
  }

  $next_update = tag1update_next_update();
  if (!$next_update) {
    $output .= '<p>' . t('The next @type will be sent to Tag1 the next time cron runs.', array('@type' => $report_type));
  }
  else {
    $output .= '<p>' . t('The next @type will be sent to Tag1 in @time.', array('@type' => $report_type, '@time' => format_interval($next_update)));
  }
  $output .= '&nbsp;&nbsp;&nbsp;' . l(t('Send manually'), 'admin/settings/tag1updates/status/manual') . '</p>';

  $last_update = variable_get('tag1update_last_update', 0);
  if (!$last_update) {
    $output .= '<p>' . t('No update has ever been sent. Please be sure you have cron configured correctly.') . '</p>';
  }
  else {
    $output .= '<p>' . t('The last update was sent @time ago.', array('@time' => format_interval(time() - $last_update))) . '</p>';
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
