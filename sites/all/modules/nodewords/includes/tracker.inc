<?php
// $Id: tracker.inc,v 1.1.4.3 2009/11/19 10:17:11 kiam Exp $

/**
 * @file
 * Integration file for tracker.module.
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
function tracker_nodewords_type_id($arg) {
  if ($arg[0] == 'tracker') {
    return array(
      NODEWORDS_TYPE_TRACKER, array(
        isset($arg[1]) && is_numeric($arg[1]) ? array($arg[1]) : array(-1)
      )
    );
  }
}

/**
 * @} End of "addtogroup nodewords".
 */
