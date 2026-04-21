#!/bin/sh
set -e

# Substitute only the two env vars we control; nginx vars ($uri, etc.) stay intact
envsubst '${MEDICAL_SERVICES_HOST} ${SPECIALTIES_HOST}' \
  < /etc/nginx/templates/nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
