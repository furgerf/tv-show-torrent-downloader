FROM ubuntu:20.04

# install packages that are already available
RUN apt-get update && apt-get autoremove -y &&  apt-get upgrade -y
RUN DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get -y install wget git gnupg npm qbittorrent-nox nginx

# install and setup mongodb
RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org.list
RUN apt-get update
RUN apt-get install -y mongodb-org
VOLUME /dumps
VOLUME /data/db

# install and setup app
RUN mkdir -p /var/www
WORKDIR /var/www/tv-show-torrent-downloader
RUN git clone https://github.com/furgerf/tv-show-torrent-downloader /var/www/tv-show-torrent-downloader
RUN ln -sf /var/www/tv-show-torrent-downloader/nginx.conf /etc/nginx/nginx.conf
RUN npm install

# access to the api
EXPOSE 8000
# access to qbittorrent-nox
EXPOSE 8080

ENTRYPOINT /var/www/tv-show-torrent-downloader/start.sh
