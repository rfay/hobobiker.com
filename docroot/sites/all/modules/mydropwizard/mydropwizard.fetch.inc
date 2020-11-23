<?php

/**
 * @file
 * Code required only when fetching information about available updates.
 */

/**
 * Callback to manually check the update status without cron.
 */
function mydropwizard_manual_status() {
  if (_mydropwizard_refresh()) {
    drupal_set_message(t('Attempted to fetch information about all available new releases and updates.'));
  }
  else {
    drupal_set_message(t('Unable to fetch any information about available new releases and updates.'), 'error');
  }
  drupal_goto('admin/reports/updates');
}

/**
 * Alternate callback for use with the Acquia Connector.
 */
function mydropwizard_acquia_agent_manual_status() {
  // Copied from acquia_agent_manual_status().
  acquia_agent_check_subscription();
  mydropwizard_manual_status();
}

/**
 * Fetch project info via XML from a central server.
 */
function _mydropwizard_refresh() {
  static $fail = array();
  global $base_url;
  module_load_include('inc', 'mydropwizard', 'mydropwizard.compare');

  // Since we're fetching new available update data, we want to clear
  // our cache of both the projects we care about, and the current update
  // status of the site. We do *not* want to clear the cache of available
  // releases just yet, since that data (even if it's stale) can be useful
  // during mydropwizard_get_projects(); for example, to modules that implement
  // hook_system_info_alter() such as cvs_deploy.
  _mydropwizard_cache_clear('mydropwizard_project_projects');
  _mydropwizard_cache_clear('mydropwizard_project_data');

  $available = array();
  $data = array();
  $site_key = md5($base_url . drupal_get_private_key());
  $projects = mydropwizard_get_projects();

  // Now that we have the list of projects, we should also clear our cache of
  // available release data, since even if we fail to fetch new data, we need
  // to clear out the stale data at this point.
  _mydropwizard_cache_clear('mydropwizard_available_releases');
  $max_fetch_attempts = variable_get('mydropwizard_max_fetch_attempts', UPDATE_MAX_FETCH_ATTEMPTS);
  
  // Call back to the server to share staistics, and see if we're using an
  // out-of-date version of the mydropwizard module.
  $project_versions = array();
  foreach ($projects as $key => $project) {
    if (strpos($project['project_type'], 'disabled') === FALSE) {
      if (!empty($project['info']['version'])) {
        $version = $project['info']['version'];
      }
      else {
        // Stub version to encode the core compatibility.
        $version = DRUPAL_CORE_COMPATIBILITY;
      }
      $project_versions[$key] = $version;
    }
  }
  $statistics_url = variable_get('mydropwizard_statistics_url', MYDROPWIZARD_STATISTICS_URL);
  $statistics_data = drupal_to_js(array(
    'site_key' => $site_key,
    'projects' => $project_versions,
    'mydropwizard_key' => variable_get('mydropwizard_customer_key', ''),
  ));
  if (variable_get('mydropwizard_http_post_disabled', FALSE)) {
    // This is a hack for a customer site that seemingly can't do HTTP POST
    // for mysterious reasons. I don't like it, but it works.
    $response = drupal_http_request($statistics_url . '?data=' . base64_encode($statistics_data));
  }
  else {
    $response = drupal_http_request($statistics_url, array('Content-type' => 'application/json'), 'POST', $statistics_data);
  }
  $update_status = $response->data;
  variable_set('mydropwizard_update_status', $update_status);

  // If the server says we're good, then pull the individual status for each project.
  if ($update_status == 'OK' || variable_get('mydropwizard_ignore_statistics_errors', FALSE)) {
    foreach ($projects as $key => $project) {
      $url = _mydropwizard_build_fetch_url($project, $site_key);
      $fetch_url_base = _mydropwizard_get_fetch_url_base($project);
      if (empty($fail[$fetch_url_base]) || count($fail[$fetch_url_base]) < $max_fetch_attempts) {
        $xml = drupal_http_request($url);
        if (isset($xml->data)) {
          $data[] = $xml->data;
        }
        else {
          // Connection likely broken; prepare to give up.
          $fail[$fetch_url_base][$key] = 1;
        }
      }
      else {
        // Didn't bother trying to fetch.
        $fail[$fetch_url_base][$key] = 1;
      }
    }
  }

  if ($data) {
    $parser = new mydropwizard_xml_parser;
    $available = $parser->parse($data);
  }
  if (!empty($available) && is_array($available)) {
    // Record the projects where we failed to fetch data.
    foreach ($fail as $fetch_url_base => $failures) {
      foreach ($failures as $key => $value) {
        $available[$key]['project_status'] = 'not-fetched';
      }
    }
    $frequency = variable_get('mydropwizard_check_frequency', 1);
    _mydropwizard_cache_set('mydropwizard_available_releases', $available, time() + (60 * 60 * 24 * $frequency));
    watchdog('mydropwizard', 'Attempted to fetch information about all available new releases and updates.', array(), WATCHDOG_NOTICE, l(t('view'), 'admin/reports/updates'));
  }
  else {
    watchdog('mydropwizard', 'Unable to fetch any information about available new releases and updates.', array(), WATCHDOG_ERROR, l(t('view'), 'admin/reports/updates'));
  }
  // Whether this worked or not, we did just (try to) check for updates.
  variable_set('mydropwizard_last_check', time());
  return $available;
}

/**
 * Generates the URL to fetch information about project updates.
 *
 * This figures out the right URL to use, based on the project's .info file
 * and the global defaults. Appends optional query arguments when the site is
 * configured to report usage stats.
 *
 * @param $project
 *   The array of project information from mydropwizard_get_projects().
 *
 * @see mydropwizard_refresh()
 * @see mydropwizard_get_projects()
 */
function _mydropwizard_build_fetch_url($project) {
  $name = $project['name'];
  $url = _mydropwizard_get_fetch_url_base($project);
  $url .= '/'. DRUPAL_CORE_COMPATIBILITY . '/';
  $url .= $name . '.xml';
  return $url;
}

/**
 * Return the base of the URL to fetch available update data for a project.
 *
 * @param $project
 *   The array of project information from mydropwizard_get_projects().
 * @return
 *   The base of the URL used for fetching available update data. This does
 *   not include the path elements to specify a particular project, version,
 *   site_key, etc.
 *
 * @see _mydropwizard_build_fetch_url()
 */
function _mydropwizard_get_fetch_url_base($project) {
  return isset($project['info']['project status url']) ? $project['info']['project status url'] : variable_get('mydropwizard_project_url', MYDROPWIZARD_PROJECT_URL);
}

/**
 * Perform any notifications that should be done once cron fetches new data.
 *
 * This method checks the status of the site using the new data and depending
 * on the configuration of the site, notifies administrators via email if there
 * are new releases or missing security updates.
 *
 * @see mydropwizard_requirements()
 */
function _mydropwizard_cron_notify() {
  include_once './includes/install.inc';
  $status = mydropwizard_requirements('runtime');
  $params = array();
  $notify_all = (variable_get('mydropwizard_notification_threshold', 'all') == 'all');
  foreach (array('self', 'core', 'contrib') as $report_type) {
    $type = 'mydropwizard_'. $report_type;
    if (isset($status[$type]['severity'])
        && ($status[$type]['severity'] == REQUIREMENT_ERROR || ($notify_all && $status[$type]['reason'] == UPDATE_NOT_CURRENT))) {
      $params[$report_type] = $status[$type]['reason'];
    }
  }
  if (!empty($params)) {
    $notify_list = variable_get('mydropwizard_notify_emails', '');
    if (!empty($notify_list)) {
      $default_language = language_default();
      foreach ($notify_list as $target) {
        if ($target_user = user_load(array('mail' => $target))) {
          $target_language = user_preferred_language($target_user);
        }
        else {
          $target_language = $default_language;
        }
        drupal_mail('mydropwizard', 'status_notify', $target, $target_language, $params);
      }
    }
  }
}

/**
 * XML Parser object to read Drupal's release history info files.
 * This uses PHP4's lame XML parsing, but it works.
 */
class mydropwizard_xml_parser {
  var $projects = array();
  var $current_project;
  var $current_release;
  var $current_term;
  var $current_tag;
  var $current_object;

  /**
   * Parse an array of XML data files.
   */
  function parse($data) {
    foreach ($data as $datum) {
      $parser = xml_parser_create();
      xml_set_object($parser, $this);
      xml_set_element_handler($parser, 'start', 'end');
      xml_set_character_data_handler($parser, "data");
      xml_parse($parser, $datum);
      xml_parser_free($parser);
    }
    return $this->projects;
  }

  function start($parser, $name, $attr) {
    $this->current_tag = $name;
    switch ($name) {
      case 'PROJECT':
        unset($this->current_object);
        $this->current_project = array();
        $this->current_object = &$this->current_project;
        break;
      case 'RELEASE':
        unset($this->current_object);
        $this->current_release = array();
        $this->current_object = &$this->current_release;
        break;
      case 'TERM':
        unset($this->current_object);
        $this->current_term = array();
        $this->current_object = &$this->current_term;
        break;
      case 'FILE':
        unset($this->current_object);
        $this->current_file = array();
        $this->current_object = &$this->current_file;
        break;
    }
  }

  function end($parser, $name) {
    switch ($name) {
      case 'PROJECT':
        unset($this->current_object);
        $this->projects[$this->current_project['short_name']] = $this->current_project;
        $this->current_project = array();
        break;
      case 'RELEASE':
        unset($this->current_object);
        $this->current_project['releases'][$this->current_release['version']] = $this->current_release;
        break;
      case 'RELEASES':
        $this->current_object = &$this->current_project;
        break;
      case 'TERM':
        unset($this->current_object);
        $term_name = $this->current_term['name'];
        if (!isset($this->current_release['terms'])) {
          $this->current_release['terms'] = array();
        }
        if (!isset($this->current_release['terms'][$term_name])) {
          $this->current_release['terms'][$term_name] = array();
        }
        $this->current_release['terms'][$term_name][] = $this->current_term['value'];
        break;
      case 'TERMS':
        $this->current_object = &$this->current_release;
        break;
      case 'FILE':
        unset($this->current_object);
        $this->current_release['files'][] = $this->current_file;
        break;
      case 'FILES':
        $this->current_object = &$this->current_release;
        break;
      default:
        if (!empty($this->current_tag) && isset($this->current_object[strtolower($this->current_tag)])) {
          $this->current_object[strtolower($this->current_tag)] = trim($this->current_object[strtolower($this->current_tag)]);
        }
        $this->current_tag = '';
    }
  }

  function data($parser, $data) {
    if ($this->current_tag && !in_array($this->current_tag, array('PROJECT', 'RELEASE', 'RELEASES', 'TERM', 'TERMS', 'FILE', 'FILES'))) {
      $tag = strtolower($this->current_tag);
      if (isset($this->current_object[$tag])) {
        $this->current_object[$tag] .= $data;
      }
      else {
        $this->current_object[$tag] = $data;
      }
    }
  }
}
