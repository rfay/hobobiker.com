<?php

$databases['default']['default'] = array(
    'database' => getenv('DDEV_MYSQL_DATABASE'),
    'username' => getenv('DDEV_MYSQL_USER'),
    'password' => getenv('DDEV_MYSQL_PASSWORD'),
    'host' => getenv('DDEV_MYSQL_HOST'),
    'driver' => 'mysql',
    'prefix' => '',
);

$settings['hash_salt'] = getenv('DRUPAL_HASH_SALT');
$settings['file_private_path'] = '/var/www/drupal-private/';
$settings['trusted_host_patterns'] = [ getenv('DRUPAL_TRUSTED_HOST_PATTERN') ];

$conf['reverse_proxy'] = TRUE;
$conf['reverse_proxy_addresses'] = array(
  $_SERVER['REMOTE_ADDR'],
);
if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ips = explode(", ", $_SERVER['HTTP_X_FORWARDED_FOR']);
    $originating_ip = array_shift($ips);
    $_SERVER['HTTP_X_FORWARDED_FOR'] = $originating_ip;
}
