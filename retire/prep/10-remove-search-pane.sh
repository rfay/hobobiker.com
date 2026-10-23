#!/usr/bin/env bash
# Remove the site's only form: the Search pane at the top of the home page. The home page is the
# Page Manager page trip_wrapped_up, rendered by Panels display 1; the pane is block search-0 there.
# A search form cannot work on a static site (Lullabot series, part 1: "remove the search form").
# Declared in test/playwright/expected-differences.json. Expect: 1 pane removed, 0 forms left.
source "$(dirname "$0")/../lib.sh"
guard_prep
removed=$(in_prep ddev mysql -N -e "
  DELETE FROM panels_pane WHERE did = 1 AND type = 'block' AND subtype = 'search-0';
  SELECT ROW_COUNT();")
prep_cc
forms=$(prep_get / | grep -c '<form' || true)
echo "remove-search-pane: $removed pane(s) removed; home page now has $forms form(s) (expect 1 and 0)"
