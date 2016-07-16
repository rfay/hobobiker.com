--------
OVERVIEW
--------
This module sends information about your website to Tag1 Consulting as part of
their Drupal 6 Long Term Support offering. It tracks which modules and themes
you have in your codebase, watching for upstream Drupal 7 and Drupal 8 security
releases to ensure that any applicable fixes are backported in a timely manner.
With this module properly installed and configured, Tag1 will notify you
whenever security patches should be applied.

Data is securely sent to Tag1. This requires that cron is configured on your
website (https://www.drupal.org/cron), and that OpenSSL support for PHP is
properly installed (http://php.net/manual/en/openssl.installation.php).

For more information, visit: https://quo.tag1consulting.com.


------------
INSTALLATION
------------
Repeat these steps for all Drupal 6 websites you've paid for the D6 LTS service
for from Tag1 Consulting. To purchase support for additional websites, contact
your reseller or email support@tag1consulting.com.

1. Install the module.
  Extract the provided tag1quo.tar.gz compressed tarball into the appropriate
  modules directory (for example: sites/all/modules).

2. Enable the module.
  Visit 'Administer › Site building › Modules' at admin/build/modules and enable
  the 'Tag1 Quo Drupal 6 integration' module.

3. Configure the module. Visit 'Administer › Site configuration ›
   Tag1 Quo Drupal 6 integration' at admin/settings/tag1quo and enter the token
   provided by Tag1 Consulting. Then click 'Save configuration'.

---------------
TROUBLESHOOTING
---------------
Be sure that you configured your Token correctly (step #3 above). If you see an
error when configuring the token, visit Recent log entries (admin/reports/dblog)
and look for messages from the 'tag1quo' module. If there's not enough
information in the logs, go to the tag1quo configuration page
(admin/settings/tag1quo), open the Advanced fieldset, and enable 'Debug
logging'. Then try to save the token again.  Finally, review the Recent log
entries once again.

If the problem is not obvious, email support@tag1consulting.com for help.
