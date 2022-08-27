#!/bin/bash

# setup variables
if [ "$1" ]; then
  host="$1"
else
  host="localhost"
fi
port=8000
torrents=1
sort='largest'

route="/subscriptions"
query="?startDownload=true&torrentSort=$sort&maxTorrentsPerEpisode=$torrents"
url=$host:$port$route

# helper function
urlencode() {
  # https://stackoverflow.com/a/37309630
  python2 -c 'import urllib, sys; print urllib.quote(sys.argv[1], sys.argv[2])' \
    "$1" "$urlencode_safe"
}

# get all subscription names
subscriptions_response=$(curl $url 2> /dev/null)
if [ $(echo $subscriptions_response | jq .code | tr -d '"') != "Success" ]; then
  echo "Unable to obtain list of subscriptions" >&2
  echo "Response: Code '$(echo $subscriptions_response | jq .code)', message '$(echo $subscriptions_response | jq .message)'" >&2
  exit 1
fi

subscriptions=$(echo $subscriptions_response | jq '.data[].name' | tr -d '"')

# loop over subscriptions
started_torrents=''
IFS=$'\n'
for subscription in $subscriptions; do
  # get update for single subscription
  update_response=$(curl -X PUT "$url/$(urlencode "$subscription")/find$query" 2> /dev/null)

  # catch and handle failure
  if [[ $(echo $update_response | jq .code | tr -d '"') != "Success" ]]; then
    echo "Failure while trying to update subscription '$subscription'" >&2
    [ -n "$started_torrents" ] && echo -e "Already started torrents: $started_torrents"
    echo -e "Response: Code '$(echo $update_response | jq .code)', message '$(echo $update_response | jq .message)'" >&2

    unset IFS
    exit 1
  fi

  # check if new torrents were started
  torrents=$(echo $update_response | jq '.data')
  if [[ $(echo $torrents | jq '. | length') -gt 0 ]]; then
    torrent_names=$(echo $torrents | jq '.[] | .name' | tr \\n ,)
    torrent_sizes=$(echo "$(echo $torrents | jq '.[].size') / 1048576" | bc | tr \\n ,)
    echo -e "Started torrent ${torrent_names::-1} (size ${torrent_sizes::-1}MB).\n"
    echo -e "Complete response: $update_response\n\n"
    started_torrents="$started_torrents\n$subscription:\t$(echo $torrents | jq 'del(.[].link)')"
  fi
done

unset IFS
exit 0

