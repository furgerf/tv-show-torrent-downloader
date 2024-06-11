#!/usr/bin/env bash

set -e

yes | qbittorrent-nox &

npm run start-bare -- --production --torrentcommand qbittorrent-nox | node_modules/bunyan/bin/bunyan
