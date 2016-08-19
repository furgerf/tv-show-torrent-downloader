#!/bin/bash

if [ "$1" ]; then
  host="$1"
else
  host="localhost"
fi
port=8000
torrents=1
sort='mostSeeded'

route="/subscriptions/find"
query="?startDownload=true&torrentSort=$sort&maxTorrentsPerEpisode=$torrents"
url=$host:$port$route$query

response=$(curl -X PUT $url 2> /dev/null)
code=$(echo $response | cut -d '"' -f 4)
message=$(echo $response | cut -d '"' -f 8)

if [ $code == "Success" ]; then
  # SUCCESS
  count=$(echo $message | cut -d ' ' -f 8)

  if [ "$count" -gt 0 ]; then
    echo "Started $count new torrent downloads."
    echo "$code: $message"
    echo ""
    echo "Complete response: $response"
  fi
else
  # FAILURE
  echo "Failure while trying to update subscriptions." >&2
  echo "$code: $message" >&2
  echo "" >&2
  echo "Complete response: $response" >&2
fi

