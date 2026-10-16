# Hobobiker.com source and migration adventure

This is the Drupal 6 PHP source code for the old Drupal 6 hobobiker.com site, a blog where Randy Fay and Nancy Lewis documented their 2.5 year trip on bicycle through the Americas in 2006-2009 (along with some other trips). Since it evolved over years, and so many years have passed, it has layers and layers of different styles and capabilities, and an awesome number of flaws.

This is also prepared for an experimental AI demo of migration to other targets, including a static html site and Drupal 11 site. 

**During the live presentation only:** the working copy is viewable at <https://hobobiker-copy--remotework--rfay.coder.ddev.com>. It will go away afterwards.

## Artifacts for Migration

### PHP Source Code

The source code is here in this repository.

```
git clone https://github.com/rfay/hobobiker.com
```

## User-generated files (sites/default/files) and sanitized database

The files and a sanitized database are at <https://github.com/rfay/hobobiker-assets/releases/tag/v1.1>

You can import these with standard `ddev import-db` and `ddev import-files` commands.

## Site Migration Kit

The [site-migration-kit](https://github.com/rfay/site-migration-kit) is the results of experimentation with a different, simpler migration, and has strategies and scripts to help a migration of this type. It gets vendored into the experimental migration repo.

```
git clone https://github.com/rfay/site-migration-kit
```

## Slides

Slides for the live series: <https://rfay.github.io/hobobiker-migration-slides/>
(source: <https://github.com/rfay/hobobiker-migration-slides>)