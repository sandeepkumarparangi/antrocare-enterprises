#!/bin/sh

set -eu

if [ ! -f .env.local ]; then
  echo "Missing .env.local. Copy .env.local.example and add local credentials."
  exit 1
fi

set -a
. ./.env.local
set +a

exec ./mvnw spring-boot:run
