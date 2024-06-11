FROM ubuntu:22.04

# install packages that are already available
RUN apt-get update && apt-get autoremove -y &&  apt-get upgrade -y
RUN DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get -y install wget npm qbittorrent-nox

# install and setup app
RUN mkdir -p /var/www
WORKDIR /var/www/tv-show-torrent-downloader
COPY package.json package-lock.json /var/www/tv-show-torrent-downloader
RUN npm install
COPY *.sh server.js /var/www/tv-show-torrent-downloader
COPY src /var/www/tv-show-torrent-downloader/src

ENTRYPOINT /var/www/tv-show-torrent-downloader/start.sh
