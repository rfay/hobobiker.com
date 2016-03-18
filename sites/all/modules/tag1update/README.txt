--------
OVERVIEW
--------
The module sends information about your website to Tag1 Consulting who is
providing you with Drupal 6 Long Term support. They track which modules and
themes you have enabled, watching for Drupal 7 and Drupal 8 releases of these
projects, backporting any relevant security issues reported upstream.

Data is sent to Tag1 at least once every 24 hours. This requires that cron is
configured on your website. (https://www.drupal.org/cron)


------------
INSTALLATION
------------
Repeat these steps for all Drupal 6 websites you've paid for D6LTS support
from Tag1 Consulting.

1. Install the module.
  Extract the provided tag1updates.tgz compressed tarball into the appropriate
  modules directory (for example: sites/all/modules).

2. Enable the module.
  Visit admin/build/modules and enable the 'Tag1 Consulting Drupal 6 update 
  status' module.

3. Configure the module.
  Visit admin/settings/tag1updates and enter the following information:
    Reporting URL: https://updates.tag1consulting.com/entity/d6lts_site
    Token: {{enter the token provided by Tag1 Consulting}}
  Click 'Save configuration'.

4. Test the module.
  Click the 'Review' tab (taking you to admin/settings/tag1updates/review) and
  confirm it lists your enabled modules and themes. You can see exactly what
  is sent to Tag1 Consulting by clicking the 'Raw data' fieldset at the
  bottom of the page.

  Now, click the 'Status' tab (taking you to admin/settings/tag1updates/status)
  and see that there are 'Changes to report'. You can wait for cron to run,
  or click 'Send manually' and be sure you 

---------------
TROUBLESHOOTING
---------------
Be sure that you configured the Reporting URL and your Token correctly. If
running a manual update generates an error, visit Recent log entries
(admin/reports/dblog) and look for messages from the 'tag1update' module.
If there's not enough information in the logs, go to the tag1updates
configuration page (admin/settings/tag1updates), open the Advanced fieldset,
and enable 'Debug logging'. Then go back to the 'Status' tab and try to
'Send manually' again. Finally, review the watchdog logs.

If the problem is not obvious, email support@tag1consulting.com for help.
