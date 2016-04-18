/**
 * Handle JavaScript enabled version of reporting as inappropriate.
 */
Drupal.behaviors.mollomReport = function (context) {
  $('a.mollom-flag:not(.mollom-flag-processed)', context).addClass('mollom-processed').each(function () {
    $(this).bind('click', function(e) {
      // retrieve the result via ajax post
      var href = $(this).attr('href');
      var postHref = href.replace('nojs', 'ajax');
      var submitHref = href.replace('nojs', 'submit');
      var hrefParts = postHref.split('/');
      var source = hrefParts.pop();
      var id = hrefParts.pop();
      var type = hrefParts.pop();
      var $self = $(this);
      var container = $self.parents('.' + type)[0];
      var $innerContainer = '';
      var $innerFormHolder = '';

      function submitReport(e) {
        $.ajax({
          type: 'POST',
          url: submitHref,
          dataType: 'json',
          data: $(container).find('form').serialize(),
          success: function(result) {
            $innerFormHolder.html(result.data);
            setTimeout(function() {
              $innerFormHolder.fadeOut(400, function() {
                if (type === 'comment') {
                  $(container).prev().remove();
                  $(container).slideUp(200, this.remove);
                }
              });
            }, 1000);
          },
          error: function(data) {
            var message = '<span class="mollom-flag-error">';
            message += Drupal.t('There has been an error submitting your feedback.');
            message += '<br />';
            message += Drupal.t('Please try again later.');
            message += '</span>';
            $innerFormHolder.html(message);
            setTimeout(function() {
              $innerFormHolder.fadeOut(400, this.remove);
            }, 1000);
          }
        });
      }

      $.ajax({
        type: 'POST',
        url: postHref,
        dataType: 'json',
        data: '',
        success: function(result) {
          $(container).prepend(result.data);
          $innerContainer = $(container).find('.mollom-flag-container');
          $innerFormHolder = $(container).find('.mollom-flag-reasons');
          Drupal.behaviors.mollomReportCancel($innerContainer);
          $(container).find('#edit-submit').bind('click', function(e) {
            submitReport(e);
            e.stopPropagation();
            return false;
          });
          $(container).bind('keydown', function(e) {
            if (e.keyCode === 13) {
              submitReport(e);
              e.stopPropagation();
              return false;
            }
          });
        },
        error: function(data) {
          // Send the user on to the non-JavaScript method.
          window.location = href;
        }
      });
      e.preventDefault();
      return false;
    });
  });
};

/**
 * Close a form to report comments as inappropriate if a user clicks outside.
 */
Drupal.behaviors.mollomReportCancel = function (context) {
  var flagContainer = null;
  var lastFocus = null;

  function closeReportDialog(e) {
    if ($('.mollom-flag-container').length > 0) {
      e.stopPropagation();
      e.preventDefault();
      $('.mollom-flag-container').remove();
      lastFocus.focus();
      $(document).unbind('keydown', checkEscapeDialog);
      $(document).unbind('click', checkClickOutside);
    }
  }

  function checkEscapeDialog(e) {
    if (e.keyCode === 27) {
      closeReportDialog(e);
    }
  }
  
  function checkClickOutside(e) {
    if ($(e.target).hasClass('mollom-flag-container') || $(e.target).parents('.mollom-flag-container').length > 0) {
      // clicked within flag container.
    } else {
      closeReportDialog(e);
    }
  }

  if ($(context).hasClass('mollom-flag-container')) {
    flagContainer = context;
    lastFocus = document.activeElement;
    flagContainer.tabIndex = -1;
    flagContainer.focus();

    $(document).bind('keydown', checkEscapeDialog);
    $(document).bind('click', checkClickOutside);
    $(context).find('#edit-cancel').bind('click', closeReportDialog);
  }
};

/**
 * Only show links to report comments after the comment has been moused over.
 */
Drupal.behaviors.mollomReportComment = function(context) {
  // Leave the report links visible for touch devices
  if (!!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator)) {
    return;
  }

  function showReportLink(e) {
    $(this).find('.mollom-flag').show();
  }

  function hideReportLink(e) {
    if ($(this).find('.mollom-flag-reasons').length === 0) {
      // Only hide the link if the comment is not currently being reported.
      $(this).find('.mollom-flag').hide();
    }
  }

  // Don't show/hide the report link if the text is aligned right or its
  // appearance will cause all other inline links to jump to the left.
  var $ul = $(context).find('.comment ul.links:has(.mollom-flag)');
  if (($ul.css('display') == 'block' && $ul.css('textAlign') == 'right')
    || $ul.css('float') == 'right'
    || $ul.find('li').css('float') == 'right') {
  } else {
    var $comment = $ul.parents('.comment');
    $comment.bind('mouseover', showReportLink);
    $comment.bind('mouseout', hideReportLink);
    $(context).find('.comment .mollom-flag').hide();
  }
}
