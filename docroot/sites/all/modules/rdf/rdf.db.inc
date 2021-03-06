<?php
// $Id: rdf.db.inc,v 1.2 2008/06/10 21:41:17 arto Exp $
/**
 * rdf_db.module - Provides RDF data storage in local RDBMS-based repositories.
 *
 * @author Arto Bendiken <http://bendiken.net/>
 * @copyright Copyright (c) 2007-2008 Arto Bendiken. All rights reserved.
 * @license GPL <http://creativecommons.org/licenses/GPL/2.0/>
 * @package rdf.module
 * @subpackage rdf_db.module
 */

//////////////////////////////////////////////////////////////////////////////

define('RDF_DB_TABLE_DEFAULT', 'rdf_data');
define('RDF_DB_TABLE_PREFIX',  'rdf_data_');
define('RDF_DB_CHECK_DUPLICATES', TRUE);

//////////////////////////////////////////////////////////////////////////////
// RDF API hooks

/**
 * Implementation of hook_rdf_namespaces().
 */
function rdf_db_rdf_namespaces() {
  $namespaces = array();
  $result = db_query('SELECT v.prefix, v.uri FROM {rdf_namespaces} v');
  while ($row = db_fetch_object($result)) {
    $namespaces[$row->prefix] = $row->uri;
  }
  return $namespaces;
}

/**
 * Implementation of hook_rdf_repositories().
 */
function rdf_db_rdf_repositories() {
  $repos = array();
  foreach (rdf_db_get_repository_names() as $name => $table) {
    $repos[$name] = array(
      'title'      => rdf_db_load_repository($name)->title,
      'type'       => 'local',
      'persistent' => TRUE,
      'mutable'    => TRUE,
      'enabled'    => TRUE,
      'statements' => rdf_db_count_repository_triples($name != 'local' ? $name : NULL),
      'module'     => 'rdf',
      'callbacks'  => array(
        'insert'   => array('function' => 'rdf_db_rdf_insert', 'arguments' => array($table)),
        'delete'   => array('function' => 'rdf_db_rdf_delete', 'arguments' => array($table)),
        'query'    => array('function' => 'rdf_db_rdf_query',  'arguments' => array($table)),
        'flush'    => array('function' => 'rdf_db_rdf_flush',  'arguments' => array($table)),
      ),
    );
  }
  return $repos;
}

/**
 * Implementation of hook_rdf_contexts().
 */
function rdf_db_rdf_contexts() {
  $contexts = array();
  foreach (rdf_db_get_repository_names() as $name => $table) {
    $result = db_query('SELECT DISTINCT g.uri g FROM {'. db_escape_table($table) . '} d INNER JOIN {rdf_resources} g ON d.gid = g.rid');
    while ($row = db_fetch_object($result)) {
      $contexts[$row->g] = TRUE;
    }
  }
  return array_keys($contexts);
}

/**
 * Implementation of hook_rdf_insert().
 */
function rdf_db_rdf_insert($table, $subject, $predicate, $object, array $options = array()) {
  $record = _rdf_db_make_record($subject, $predicate, $object, $options);

  return drupal_write_record($table, $record) ? (int)$record->did : FALSE;
}

/**
 * Implementation of hook_rdf_delete().
 */
function rdf_db_rdf_delete($table, $subject, $predicate, $object, array $options = array()) {
  $schema = drupal_get_schema($table);
  $record = _rdf_db_make_record($subject, $predicate, $object, $options);

  $conditions = $values = array();
  foreach (get_object_vars($record) as $key => $value) {
    if (!is_null($value)) {
      $conditions[] = $key . ' = ' . db_type_placeholder($schema['fields'][$key]['type']);
      $values[] = $value;
    }
  }

  return !!db_query('DELETE FROM {' . $table . '}' . (empty($conditions) ? '' : (' WHERE ' . implode(' AND ', $conditions))), $values);
}

/**
 * Implementation of hook_rdf_query().
 */
function rdf_db_rdf_query($table, $subject, $predicate, $object, array $options = array()) {
  $result = db_query(_rdf_db_sql_select($table, $subject, $predicate, $object, $options));

  $data = array();
  while ($row = db_fetch_object($result)) {
    $object = $row->o ? rdf_uriref($row->o) : rdf_literal($row->data, $row->lang, $row->type);
    $data[] = array($row->s, $row->p, $object);
  }
  return $data;
}

//////////////////////////////////////////////////////////////////////////////
// RDF DB repository API

function rdf_db_load_namespace($prefix) {
  return db_fetch_object(db_query("SELECT v.* FROM {rdf_namespaces} v WHERE v.prefix = '%s'", $prefix));
}

function rdf_db_get_repository_names() {
  $names = array();
  foreach (rdf_db_get_repository_tables() as $table) {
    $name = substr($table, strlen(RDF_DB_TABLE_PREFIX));
    $name = $name ? $name : 'local';
    $names[$name] = $table;
  }
  return $names;
}

function rdf_db_get_repository_tables() {
  $tables = array(RDF_DB_TABLE_DEFAULT);

  switch ($GLOBALS['db_type']) {
    case 'mysql':
    case 'mysqli':
      $result = db_query("SHOW TABLES LIKE '{" . RDF_DB_TABLE_PREFIX . "}%'");
      break;
    case 'pgsql':
      // TODO: this has NOT actually been tested:
      $result = db_query(
        "SELECT tablename FROM pg_tables WHERE tablename LIKE '{" . RDF_DB_TABLE_PREFIX . "}%' UNION " .
        "SELECT viewname FROM pg_views WHERE viewname LIKE '{" . RDF_DB_TABLE_PREFIX . "}%'");
      break;
    default:
      // Not implemented
      break;
  }

  if (!empty($result)) {
    $prefix_length = strlen(db_prefix_tables('{' . RDF_DB_TABLE_PREFIX . '}')) - strlen(RDF_DB_TABLE_PREFIX);
    while ($row = db_fetch_array($result)) {
      $table = reset($row); // first column
      $tables[] = substr($table, $prefix_length);
    }
  }
  return $tables;
}

function rdf_db_load_repository($name) {
  $metadata = variable_get('rdf_db_repository[' . $name . ']', array());
  return (object)array('name' => $name, 'title' => @$metadata['dc:title'], 'description' => @$metadata['dc:description']);
}

function rdf_db_create_repository($name, $metadata = array()) {
  $schema = drupal_get_schema(RDF_DB_TABLE_DEFAULT);
  db_create_table($results, db_escape_table(RDF_DB_TABLE_PREFIX . $name), $schema);
  rdf_db_update_repository_metadata($name, $metadata);
  drupal_get_schema(db_escape_table(RDF_DB_TABLE_PREFIX . $name), TRUE); // clear the schema cache
  return $results[0]['success'];
}

function rdf_db_delete_repository($name) {
  db_drop_table($results, db_escape_table(RDF_DB_TABLE_PREFIX . $name));
  rdf_db_delete_repository_metadata($name);
  return $results[0]['success'];
}

function rdf_db_rename_repository($old_name, $new_name) {
  db_rename_table($results,
    db_escape_table(RDF_DB_TABLE_PREFIX . $old_name),
    db_escape_table(RDF_DB_TABLE_PREFIX . $new_name));
  return $results[0]['success'];
}

function rdf_db_update_repository_metadata($name, $metadata = array()) {
  variable_set('rdf_db_repository[' . $name . ']', $metadata);
}

function rdf_db_delete_repository_metadata($name) {
  variable_del('rdf_db_repository[' . $name . ']');
}

function rdf_db_count_repository_triples($name = NULL) {
  $table = db_escape_table(!$name ? RDF_DB_TABLE_DEFAULT : RDF_DB_TABLE_PREFIX . $name);
  return db_result(db_query('SELECT COUNT(did) FROM {' . $table . '}'));
}

//////////////////////////////////////////////////////////////////////////////
// RDF DB helper functions

function _rdf_db_make_record($subject, $predicate, $object, array $options = array()) {
  $is_uri     = is_object($object) && ($object instanceof RDF_URIRef);
  $is_literal = is_object($object) && ($object instanceof RDF_Literal);

  $record = (object)array();
  $record->gid  = isset($options['graph']) ? _rdf_db_uri_to_id($options['graph']) : NULL;
  $record->sid  = $subject ? _rdf_db_uri_to_id($subject) : NULL;
  $record->pid  = $predicate ? _rdf_db_uri_to_id($predicate) : NULL;
  $record->oid  = $object && $is_uri ? _rdf_db_uri_to_id((string)$object) : NULL;
  $record->tid  = $object && rdf_get_datatype($object) ? _rdf_db_uri_to_id(rdf_qname_to_uri(rdf_get_datatype($object))) : NULL;
  $record->lang = $object && $is_literal ? $object->language : NULL;
  $record->data = $object && !$is_uri ? ($is_literal ? $object->value : (string)$object) : NULL;
  return $record;
}

function _rdf_db_uri_to_id($uri) {
  // TODO: CURIE-to-URI normalization, and lookup caching.
  return ($id = _rdf_db_uri_to_id_select($uri)) ? $id : _rdf_db_uri_to_id_insert($uri);
}

function _rdf_db_uri_to_id_insert($uri) {
  return @drupal_write_record('rdf_resources', $record = (object)array('uri' => $uri)) !== FALSE ? (int)$record->rid : FALSE;
}

function _rdf_db_uri_to_id_select($uri) {
  return (int)db_result(db_query("SELECT r.rid FROM {rdf_resources} r WHERE r.uri = '%s'", $uri));
}

function _rdf_db_sql_select($table, $subject, $predicate, $object, $options = array()) {
  $query = $where = array();

  $sql = 'SELECT g.uri g, s.uri s, p.uri p, o.uri o, t.uri type, d.lang, d.data FROM {%s} d
            LEFT JOIN  {rdf_resources} g ON d.gid = g.rid
            INNER JOIN {rdf_resources} s ON d.sid = s.rid
            INNER JOIN {rdf_resources} p ON d.pid = p.rid
            LEFT JOIN  {rdf_resources} o ON d.oid = o.rid
            LEFT JOIN  {rdf_resources} t ON d.tid = t.rid';
  $query[] = sprintf($sql, db_escape_table($table));

  if (isset($options['graph'])) {
    $where[] = sprintf("g.uri = '%s'", db_escape_string((string)$options['graph']));
  }

  if ($subject) {
    $where[] = sprintf("s.uri = '%s'", db_escape_string((string)$subject));
  }

  if ($predicate) {
    $where[] = sprintf("p.uri = '%s'", db_escape_string((string)$predicate));
  }

  if ($object) {
    // Assume an object means an RDF_URIRef, but convert it to a URI string
    // using duck typing so that other classes can be substituted
    // TODO: support language-tagged and datatyped literals
    $where[] = sprintf(is_object($object) ? "o.uri = '%s'" : "d.data = '%s'", db_escape_string((string)$object));
  }

  $query[] = empty($where) ? '' : 'WHERE (' . implode(') AND (', $where) . ')';
  $query[] = 'ORDER BY d.did ASC';
  return implode("\n", $query);
}
