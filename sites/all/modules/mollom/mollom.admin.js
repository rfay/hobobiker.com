/**
 * Attaches jQuery MultiSelect.
 */
Drupal.behaviors.mollomMultiSelect = function(context) {
  if ($().asmSelect) {
    $(context).find('select[multiple]').asmSelect({
      animate: true,
      highlight: true,
      hideWhenAdded: true,
      removeLabel: Drupal.t('remove'),
      highlightAddedLabel: Drupal.t('Added: '),
      highlightRemovedLabel: Drupal.t('Removed: ')
    });
  }

  // Adjust the recommended display for discarding spam based on moderation
  // settings.
  $(context).find('#mollom-admin-configure-form').each(function() {
    function updateRecommendedDiscard($form) {
      if ($form.find('input[name="mollom[moderation]"]').is(':checked')) {
        $form.find('label[for="edit-mollom-discard-0"] .mollom-recommended').show();
        $form.find('label[for="edit-mollom-discard-1"] .mollom-recommended').hide();
      } else {
        $form.find('label[for="edit-mollom-discard-0"] .mollom-recommended').hide();
        $form.find('label[for="edit-mollom-discard-1"] .mollom-recommended').show();
      }
    }

    $(this).find('input[name="mollom[moderation]"]').change(function(e) {
      updateRecommendedDiscard($(this).parents('form'));
    });

    updateRecommendedDiscard($(this));
  });
};
