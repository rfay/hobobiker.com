<?php

/**
 * @file
 * Implementation of 'mydropwizard' update_status engine for Drupal 6.
 */

class myDropWizardStatusInfo {

  /**
   * {@inheritdoc}
   */
  public function __construct($type, $engine, $config) {
    $this->engine_type = $type;
    $this->engine = $engine;
    $this->engine_config = $config;
  }

  /**
   * {@inheritdoc}
   */
  function lastCheck() {
    return variable_get('mydropwizard_last_check', 0);
  }

  /**
   * {@inheritdoc}
   */
  function refresh() {
    mydropwizard_refresh();
  }

  /**
   * Perform adjustments before running get status.
   */
  function beforeGetStatus(&$projects, $check_disabled) {
    // @todo: do we need to do anything?
  }

  /**
   * Get update information for all installed projects.
   *
   * @return
   *   Array of update status information.
   */
  function getStatus($projects, $check_disabled) {
    $this->beforeGetStatus($projects, $check_disabled);
    $available = $this->getAvailableReleases();
    $update_info = $this->calculateUpdateStatus($available, $projects);
    $this->afterGetStatus($update_info, $projects, $check_disabled);
    return $update_info;
  }

  /**
   * Perform adjustments after running get status.
   */
  function afterGetStatus(&$update_info, $projects, $check_disabled) {
    // Normalize our new status to a status that drush knows.
    foreach ($update_info as $key => &$project) {
      if ($project['status'] == UPDATE_NOT_SECURE_AND_NOT_SUPPORTED) {
        $project['status'] = UPDATE_NOT_SECURE;
      }
    }
  }

  /**
   * Obtains release info for all installed projects via update.module.
   *
   * @see mydropwizard_get_available().
   * @see mydropwizard_manual_status().
   */
  protected function getAvailableReleases() {
    // We force a refresh if the cache is not available.
    if (!cache_get('mydropwizard_available_releases', 'cache_mydropwizard')) {
      $this->refresh();
    }

    $available = mydropwizard_get_available(TRUE);

    // Force to invalidate some mydropwizard caches that are only cleared
    // when visiting update status report page.
    if (function_exists('_mydropwizard_cache_clear')) {
      _mydropwizard_cache_clear('mydropwizard_project_data');
      _mydropwizard_cache_clear('mydropwizard_project_projects');
    }

    return $available;
  }

  /**
   * Calculates update status for all projects via mydropwizard.module.
   */
  protected function calculateUpdateStatus($available, $projects) {
    module_load_include('inc', 'mydropwizard', 'mydropwizard.compare');
    $data = mydropwizard_calculate_project_data($available);

    foreach ($data as $project_name => $project) {
      // Discard custom projects.
      if ($project['status'] == UPDATE_UNKNOWN) {
        unset($data[$project_name]);
        continue;
      }
      // Discard projects with unknown installation path.
      if ($project_name != 'drupal' && !isset($projects[$project_name]['path'])) {
        unset($data[$project_name]);
        continue;
      }

      // Add some info from the project to $data.
      $data[$project_name] += array(
        'path'  => isset($projects[$project_name]['path']) ? $projects[$project_name]['path'] : '',
        'label' => $projects[$project_name]['label'],
      );
      // Store all releases, not just the ones selected by mydropwizard.module.
      // We use it to allow the user to update to a specific version.
      if (isset($available[$project_name]['releases'])) {
        $data[$project_name]['releases'] = $available[$project_name]['releases'];
      }
    }

    return $data;
  }

}

