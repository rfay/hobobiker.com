--------
OVERVIEW
--------
This module sends information about your website to Tag1 Consulting, as they
are providing you with Drupal 6 Long Term Support. It tracks which modules and
themes you have in your codebase, watching for Drupal 7 and Drupal 8 releases
of these projects, backporting any relevant security issues reported upstream.
With this module properly installed and configured, Tag1 will notify you
whenever security issues are found.

Data is securely sent to Tag1 at least once every day. This requires that cron
is configured on your website (https://www.drupal.org/cron), and that OpenSSL
support for PHP is properly installed
(http://php.net/manual/en/openssl.installation.php).


------------
INSTALLATION
------------
Repeat these steps for all Drupal 6 websites you've paid for the D6 LTS service
for from Tag1 Consulting. To purchase support for additional websites, contact
support@tag1consulting.com.

1. Install the module.
  Extract the provided tag1update.tar.gz compressed tarball into the appropriate
  modules directory (for example: sites/all/modules). Remove any version string
  from the end of the directory name containing the module files. For example,
  rename from "tag1update-1.0" to "tag1update".

2. Enable the module.
  Visit 'Administer › Site building › Modules' at admin/build/modules and enable
  the 'Tag1 Consulting Drupal 6 update status' module.

3. Configure the module.
  Visit 'Administer › Site configuration › Tag1 Consulting Drupal 6 updates' at
  admin/settings/tag1updates and enter the token provided by Tag1 Consulting.
  Then click 'Save configuration'.

4. Test the module.
  Click the 'Review' tab (taking you to admin/settings/tag1updates/review) and
  confirm it lists your modules and themes. You can see exactly what is sent to
  Tag1 Consulting by clicking the 'Raw data' fieldset at the bottom of the page.

  Now, click the 'Status' tab (taking you to admin/settings/tag1updates/status)
  to see when the next heartbeat will be sent to Tag1. We recommend you test
  that everything is correctly configured the first time by clicking 
  'Send manually'.

---------------
TROUBLESHOOTING
---------------
Be sure that you configured your Token correctly (step #3 above). If running a
manual update generates an error, visit Recent log entries (admin/reports/dblog)
and look for messages from the 'tag1update' module. If there's not enough
information in the logs, go to the tag1updates configuration page
(admin/settings/tag1updates), open the Advanced fieldset, and enable 'Debug
logging'. Then go back to the 'Status' tab and try to 'Send manually' again.
Finally, review the Recent log entries again.

If the problem is not obvious, email support@tag1consulting.com for help.
