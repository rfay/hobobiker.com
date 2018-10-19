<?php

/**
 * @file
 * Drush extension for myDropWizard module.
 */

require_once 'drush/myDropWizardStatusInfo.php';
require_once 'drush/myDropWizardReleaseInfo.php';
require_once 'drush/myDropWizardProject.php';

function mydropwizard_drush_command() {
  return array(
    'mydropwizard-list-projects' => array(
      'description' => 'Outputs the list of enabled projects on this site.',
      'options' => array(
        'branch-only' => 'Only output the major branch version - not the full version string',
      ),
      'outputformat' => array(
        'default' => 'table',
        'pipe-format' => 'csv',
        'field-labels' => array('project' => 'Project', 'version' => 'Version'),
        'fields-default' => array('project', 'version'),
        'output-data-type' => 'format-table',
      ),
    ),
  );
}

function _drush_mydropwizard_return_table($data) {
  if (DRUSH_MAJOR_VERSION >= 6) {
    return $data;
  }

  $command = drush_get_command();
  $rows = array();

  // Build the header.
  $row = array();
  foreach ($command['outputformat']['fields-default'] as $key) {
    $row[] = dt($command['outputformat']['field-labels'][$key]);
  }
  $rows[] = $row;

  // Build the subsequent rows.
  foreach ($data as $item) {
    $row = array();
    foreach ($command['outputformat']['fields-default'] as $key) {
      $row[] = $item[$key];
    }
    $rows[] = $row;
  }

  drush_print_table($rows, TRUE);
}

function drush_mydropwizard_list_projects() {
  require_once 'mydropwizard.module';
  require_once 'mydropwizard.compare.inc';
  $available_projects = mydropwizard_get_projects();

  $data = array();
  foreach ($available_projects as $project_id => $project) {
    $version = $project['info']['version'];

    // Switch to only major branch version.
    if (drush_get_option('branch-only')) {
      // Drupal needs a slightly different pattern.
      if (in_array($project_id, array('drupal', 'pressflow'))) {
        $pattern = '/^(\d+)/';
      }
      else {
        $pattern = '/^\d+.x-(\d+)/';
      }

      // Extract the major version part.
      if (preg_match($pattern, $version, $matches)) {
        $version = $matches[1];
      }
      else {
        $version = '0';
      }
    }

    $data[] = array(
      'project' => $project_id,
      'version' => $version,
    );
  }

  return _drush_mydropwizard_return_table($data);
}

/**
 * Implements hook_drush_engine_ENGINE_TYPE().
 */
function mydropwizard_drush_engine_update_status() {
  // Drush < 7 calls this engine 'update_info' so we're safe not wrapping this
  // in a version check.
  return array(
    'mydropwizard' => array(
      'description' => 'Check available updates with mydropwizard.module.',
      'drupal dependencies' => array('mydropwizard'),
      'class' => 'myDropWizardStatusInfo',
    ),
  );
}

/**
 * Implements hook_drush_engine_ENGINE_TYPE().
 */
function mydropwizard_drush_engine_release_info() {
  if (DRUSH_MAJOR_VERSION >= 7) {
    return array(
      'mydropwizard' => array(
        'description' => 'Get release info from mydropwizard.',
        'class' => 'myDropWizardReleaseInfo',
      ),
    );
  }

  return array();
}

/**
 * Implements hook_drush_command_alter().
 */
function mydropwizard_drush_command_alter(&$command) {
  if (DRUSH_MAJOR_VERSION >= 7) {
    $drupal_major_version = drush_drupal_major_version();
    if ($drupal_major_version == 6) {
      if (isset($command['engines']['release_info'])) {
        $command['engines']['release_info']['default'] = 'mydropwizard';
      }
      if (isset($command['engines']['update_status'])) {
        $command['engines']['update_status']['default'] = 'mydropwizard';
      }
    }
  }
}

/**
 * Implements hook_drush_invoke_alter().
 */
function mydropwizard_drush_invoke_alter(&$commands, $hook) {
  if (DRUSH_MAJOR_VERSION >= 7) {
    if ($hook == 'drush_engine_type_info') {
      // Remove pm_drush_engine_type_info() so we can replace it with our own
      // hook_drush_engine_type_info() that returns the same info with some
      // modifications to the 'release_info' engine type.
      if (($index = array_search('pm', $commands)) !== FALSE) {
        unset($commands[$index]);
      }
    }
  }
}

/**
 * Implements hook_drush_engine_type_info_alter().
 */
function mydropwizard_drush_engine_type_info() {
  if (DRUSH_MAJOR_VERSION >= 7) {
    $info = pm_drush_engine_type_info();
    // Make it possible to override the release backend.
    if (isset($info['release_info'])) {
      $info['release_info']['option'] = 'release-backend';
      $info['release_info']['default'] = 'updatexml';
    }
    return $info;
  }
}

/**
 * Implements hook_drush_help_alter().
 */
function mydropwizard_drush_help_alter(&$command) {
  if (DRUSH_MAJOR_VERSION >= 7) {
    // Hack to propagate the 'release-backend' option to backend invocations.
    if ($command['command'] == 'global-options') {
      $command['options']['release-backend'] = array(
        'hidden' => TRUE,
        'propagate' => TRUE,
      );
    }
  }
}
