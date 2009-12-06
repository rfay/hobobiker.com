<?php
// $Id: taxonomy.inc,v 1.1.4.3 2009/11/19 10:17:11 kiam Exp $

/**
 * @file
 * Integration file for taxonomy.module.
 */

/**
 * @addtogroup nodewords
 * @{
 */

/*****************************************************************************
 * Drupal hooks.
 ****************************************************************************/

/**
 * Implementation of hook_nodewords_type_id().
 */
function taxonomy_nodewords_type_id($arg) {
  if ($arg[0] == 'taxonomy') {
    // Taxonomy paths: taxonomy/term/$tid , taxonomy/term/$tid1+$tid2
    if (isset($arg[1]) && isset($arg[2]) && $arg[1] == 'term') {
      $ids = preg_split('![+, ]!', $arg[2]);

      if (count($ids)) {
        // Verify that $ids contains all numeric values.
        foreach ($ids as $id) {
          if (!is_numeric($id)) {
            return array(NODEWORDS_TYPE_NONE, array());
          }
        }

        return array(NODEWORDS_TYPE_TERM, $ids);
      }
    }
  }
}

/**
 * @} End of "addtogroup nodewords".
 */
