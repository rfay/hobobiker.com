<?php

/**
 * @file
 * Flag as inappropriate page callbacks for Mollom module.
 */

/**
 * Helper function to retrieve public reasons to flag content as inappropriate.
 * PHP does not allow defining these as a constant but at least
 * they can be defined once for code maintenance purposes.
 */
function _mollom_flag_reasons() {
  return array(
    'spam' => t('Spam, unsolicited advertising'),
    'profanity' => t('Obscene, abusive, profane language'),
    'unwanted' => t('Off-topic'),
  );
}

/**
 * Helper function to retrieve the flag counts for a particular entity.
 *
 * @param $entity
 *   The type of entity to retrieve counts for.
 * @param $id
 *   The id of the entity to retrieve counts for.
 */
function _mollom_flag_entity_count($entity, $id) {
  // Get the data for this entity.
  $data = mollom_data_load($entity, $id);

  $totals = array(
    'spam' => 0,
    'profanity' => 0,
    'unwanted' => 0,
    'quality' => 0,
    'total' => 0,
  );

  // Update the totals for all reasons.
  if (!empty($data)) {
    $totals['spam'] = $data->flags_spam;
    $totals['profanity'] = $data->flags_profanity;
    $totals['unwanted'] = $data->flags_unwanted;
    $totals['quality'] = $data->flags_quality;
    $totals['total'] = $data->flags_spam + $data->flags_profanity + $data->flags_unwanted + $data->flags_quality;
    arsort($totals);
  }
  return $totals;
}

/**
 * Callback handler for public users to report content as inappropriate.
 *
 * This is step one of the two-step process.  The user can now indicate the
 * reason for the report as one of spam, quality, profanity, or unwelcome.
 *
 * @param $type
 *   The request type submitted, one of "ajax" or "nojs" or "submit".
 * @param $entity
 *   The type of entity that is being reported.
 * @param $id
 *   The entity identifier that is being reported.
 * @param $source
 *   The optional internal source to be submitted along with feedback.
 */
function _mollom_flag($type, $entity, $id, $source = NULL) {
  $detail = FALSE;
  if ($type === 'nojs' || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    $detail = TRUE;
  }
  else if ($type === 'submit') {
    return mollom_flag_reason_form_submit_ajax();
  }
  // Return the form via Ajax call.
  $form = drupal_get_form('mollom_flag_reason_form', $entity, $id, $detail, $source);

  // If not submitted via Ajax post, then return a plain Drupal form page.
  if ($detail) {
    return $form;
  }
  $form_html = '<div class="mollom-flag-container" role="dialog" aria-label="' . t('Report') . '">' . $form . '</div>';
  drupal_json(array('status' => TRUE, 'data' => $form_html));
}

/**
 * Form builder for flag as inappropriate reporting.
 * This is used in both JavaScript enabled and disabled environments.
 *
 * @param $entity
 *   The type of entity that is being reported.
 * @param $id
 *   The entity id that is being reported.
 * @param $detail
 *   True if the form should return details of the entity to report.
 *   False to leave entity details out of the form display.
 * @param $source
 *   The optional internal source to be submitted along with feedback.
 */
function mollom_flag_reason_form(&$form_state, $entity, $id, $detail, $source = NULL) {
  $form['#prefix'] = "<div id=\"mollom-flag-$entity-$id\" class=\"mollom-flag-reasons\">";
  $form['#suffix'] = '</div>';
  $form['#cache'] = TRUE;

  // If the user is able to moderate content, then inform them that this will not
  // delete the content as they might expect from standard moderation.
  if (mollom_report_access($entity, $id)) {
    $form['moderation_notice'] = array(
      '#markup' => '<p>' . t('Admin mode enabled: feedback will be sent to Mollom.') . '<br />' . t('You will still need to remove content through standard means.') . '</p>',
    );
    $form['feedback_type'] = array(
      '#type' => 'value',
      '#value' => 'moderate',
    );
  }
  else {
    $form['feedback_type'] = array(
      '#type' => 'value',
      '#value' => 'flag',
    );
  }

  // Add content summary if details should be shown.
  $form['detail'] = array(
    '#type' => 'value',
    '#value' => $detail,
  );
  if ($detail !== FALSE) {
    if ($entity === 'node') {
      $node = node_load($id);
      $entity_subject = $node->title;
      $form['destination'] = array(
        '#type' => 'value',
        '#value' => "node/$id",
      );
    }
    else if ($entity === 'comment') {
      $comment = _comment_load($id);
      $entity_subject = $comment->subject . '<br />' . $comment->comment;
      $form['destination'] = array(
        '#type' => 'value',
        '#value' => 'node/' . $comment->nid,
      );
    }

    $form['detailset'] = array(
      '#type' => 'fieldset',
      '#title' => t('Reporting'),
      '#tree' => TRUE,
    );
    $form['detailset']['detail'] = array(
      '#value' => '<div class="mollom-report-content">' . filter_xss($entity_subject) . '</div>',
    );
  }

  $form['reason'] = array(
    '#type' => 'radios',
    '#title' => t('Why are you reporting this content?'),
    '#options' => _mollom_flag_reasons(),
    '#default_value' => 'spam',
    '#required' => TRUE,
  );

  $form['entity'] = array(
    '#type' => 'value',
    '#value' => $entity,
  );

  $form['id'] = array(
    '#type' => 'value',
    '#value' => $id,
  );

  $form['source'] = array(
    '#type' => 'value',
    '#value' => $source,
  );

  $form['actions'] = array(
    '#prefix' => '<div class="container-inline">',
    '#suffix' => '</div>',
  );

  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Submit report'),
  );

  // Override the cancel link to handle close actions.
  $form['actions']['cancel'] = array(
    '#type'   => 'submit',
    '#value'  => t('Cancel'),
    '#submit' => array('mollom_flag_reason_form_cancel'),
  );
  return $form;
}

/**
 * Form submit handler for mollom_flag_reason_form().
 */
function mollom_flag_reason_form_submit($form, &$form_state) {
  $entity = $form_state['values']['entity'];
  $id = $form_state['values']['id'];
  $feedback_type = $form_state['values']['feedback_type'];
  $reason = $form_state['values']['reason'];
  $source = $form_state['values']['source'];
  $count_field = 'flags_' . $reason;
  $data = mollom_data_load($entity, $id);
  // We can only send data to Mollom that has been processed.
  if (!empty($data)) {
    _mollom_send_feedback($data, $reason, $feedback_type, $source);
    $data->$count_field += 1;
    mollom_data_save($data);
  }
  else {
    // Save the minimum entity data to be able to track reporting counts.
    $data = new stdClass();
    $data->entity = $entity;
    $data->id = $id;
    $data->$count_field = 1;
    mollom_data_save($data);
  }
  // If the form was shown on its own page with detail then display a standard
  // Drupal message style.  Forms shown in a dialog handle confirmation
  // separately.
  if ($form_state['values']['detail']) {
    drupal_set_message(t('Thank you for your feedback.'));
    $url = isset($form_state['values']['destination']) ? $form_state['values']['destination'] : '';
    $form_state['redirect'] = $url;
  }
}

/**
 * Form submit handler when called from AJAX functionality.
 */
function mollom_flag_reason_form_submit_ajax() {
  $form_state = array(
    'storage' => NULL,
    'submitted' => FALSE,
    'values' => $_POST,
  );
  $form = form_get_cache($_POST['form_build_id'], $form_state);
  if (!empty($form)) {
    $form_state['post'] = $form['#post'] = $_POST;
    $form_id = $form['form_id']['#value'];
    $form['#programmed'] = $form['#redirect'] = FALSE;
    drupal_process_form($form_id, $form, $form_state);
    drupal_json(array('status' => TRUE, 'data' => t('Thank you for your feedback.')));
  }
  else {
    drupal_json(array('status' => FALSE, 'data' => t('There has been an error submitting your feedback.')));
  }
}

/**
 * Form cancellation handler for mollom_flag_reason_form().
 */
function mollom_flag_reason_form_cancel($form, &$form_state) {
  $url = isset($form_state['values']['destination']) ? $form_state['values']['destination'] : '';
  $form_state['redirect'] = $url;
}

/**
 * Helper function to add row to admin tables for flag as inappropriate counts.
 *
 * This function only adds the data for the flag counts.  The theme functions
 * for the overview admin tables are overridden to include the headers and
 * table column data.
 *
 * @param $type
 *   The entity type that is being shown.
 * @param $rows
 *   A reference to the row associate array
 * @param $ids
 *   An array of ids of type $type to get flags for.
 *
 * @see mollom_theme_comment_admin_overview().
 * @see mollom_theme_node_admin_nodes().
 */
function _mollom_table_add_flag_counts($type, &$rows, $ids) {
  if (!mollom_flag_entity_type_access($type)) {
    return;
  }

  // Add the flag data to each row.
  $rows['flagged'] = array();
  $flags = mollom_entity_type_load($type);
  foreach ($ids as $id => $empty) {
    $count = 0;
    if (isset($flags[$id])) {
      $count = $flags[$id]->flags_spam + $flags[$id]->flags_profanity + $flags[$id]->flags_quality + $flags[$id]->flags_unwanted;
    }
    if ($count > 0) {
      if ($type === 'comment') {
        $edit_url = "comment/edit/$id";
      }
      else if ($type === 'node') {
        $edit_url = "node/$id/edit";
      }
      $rows['flagged'][$id] = array(
        '#value' => l($count, $edit_url, array('query' => array('mollom_flag_details' => 1), 'fragment' => 'mollom-flag-details')),
      );
    } else {
      $rows['flagged'][$id] = array('#value' => $count);
    }
  }
}

/**
 * Adds flag data to comment edit form for administrators.
 *
 * Called from hook_form_FORMID_alter().
 */
function mollom_flag_comment_form_alter(&$form, &$form_state) {
  // Make sure we are editing a comment.
  if (empty($form['cid']['#value'])) {
    return;
  }
  $comment = _comment_load($form['cid']['#value']);
  if (empty($comment)) {
    return;
  }
  // Make sure the user has access to administer Mollom for this content.
  if (!user_access('administer mollom') ||
    !mollom_flag_entity_type_access('comment', $comment)) {
    return;
  }
  // Get the flag counts for this comment.
  $totals = _mollom_flag_entity_count('comment', $comment->cid);
  $output = array();
  $markup = $totals['total'] . ' ' . t('total');
  if ($totals['total'] > 0) {
    $reasons = _mollom_flag_reasons();
    foreach ($totals as $reason=>$total) {
      if ($total > 0 && $reason !== 'total') {
        $output[] = $total . ': ' . $reasons[$reason];
      }
    }
    $markup = theme('item_list', $output, NULL, 'ul', array('class' => 'form-item'));
  }

  $form['admin']['mollom_flags'] = array(
    '#type' => 'item',
    '#title' => t('User flags'),
    '#value' => $markup,
  );

  // Expand the admin fieldset if requested.
  if (!empty($_GET['mollom_flag_details'])) {
    $form['admin']['#collapsed'] = FALSE;
  }
}

/**
 * Add flag details to a node edit form.
 * 
 * @see mollom_form_node_form_alter.
 */
function mollom_flag_node_form_alter(&$form, &$form_state, $form_id) {
  $node = $form['#node'];
  // Make sure this is a node edit form.
  if (!isset($node->nid) || isset($node->is_new)) {
    return;
  }

  // Node options for administrators.
  $form['mollom_flags'] = array(
    '#type' => 'fieldset',
    '#access' => user_access('administer mollom') && mollom_flag_entity_type_access('node', $node),
    '#title' => t('User Flags'),
    '#collapsible' => TRUE,
    '#collapsed' => empty($_GET['mollom_flag_details']) ? TRUE : FALSE,
    '#weight' => 100,
  );

  $totals = _mollom_flag_entity_count('node', $node->nid);
  if ($totals['total'] == 0) {
    $form['mollom_flags']['details'] = array(
      '#markup' => t('This content has not been flagged by users as inappropriate.'),
    );
  }
  else {
    $reasons = _mollom_flag_reasons();
    $output = array();
    foreach ($totals as $reason => $flag_count) {
      if ($flag_count > 0 && $reason !== 'total') {
        $output[] = $flag_count . ': ' . $reasons[$reason];
      }
    }
    $form['mollom_flags']['details'] = array(
      '#value' => theme('item_list',
        $output,
        format_plural($totals['total'], 'Flagged by users 1 time.', 'Flagged by users @count times.'),
        'ul',
        array('id' => 'mollom-flag-details')
      ),
    );
  }
}
