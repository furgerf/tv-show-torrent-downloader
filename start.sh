#!/usr/bin/env bash

yes | qbittorrent-nox &

mongod &

for dump in /dumps/*; do
  echo "Importing $dump"
  mongorestore -v -d tv-shows mongodb://localhost:27017 "$dump" #&& rm -r "$dump"
done

nginx

npm run start-bare -- --production --torrentcommand qbittorrent-nox | node_modules/bunyan/bin/bunyan
