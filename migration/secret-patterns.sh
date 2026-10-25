# Shapes of secrets that must never be in a published snapshot or archive, as name=extended-regex pairs.
# Sourced by migration/sanitize-snapshot.sh (the database snapshot) and retire/37-scan-secrets.sh (the
# static archive), so both gates look for the same things.
secret_patterns=(
  'aws_access_key=(AKIA|ASIA)[A-Z0-9]{16}'
  'google_api_key=AIza[0-9A-Za-z_-]{35}'
  'google_maps_v1_key=ABQIAAAA[0-9A-Za-z_-]{20}'
  'private_key=-----BEGIN [A-Z ]*PRIVATE KEY'
  "url_with_password=[a-z][a-z0-9+.-]*://[^/@:[:space:]'\"\\\\]+:[^/@[:space:]'\"\\\\]+@"
)

# Files removed from production on 2026-10-24 because they held personal data (names only; the contents
# were never recorded), relative to sites/default/files.
removed_personal_files=(
  maps/WSLNHandVT.xml maps/NHWarmShowers.xml maps/NEFamily.xml maps/warmshowers.html maps/warmshowers.xsl
  maps/newenglandcontacts.html maps/NEFamily.xsl
)
