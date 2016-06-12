# Overview

This is a two-component application that facilitates keeping up to date with tv shows. It consists of a node.js backend and a (rudimental) web frontend. Information about the user's tv shows is stored in MongoDB. Downloads are started by issuing the
`torrentCommand`, a configurable command that should be a torrent client and is executed with the torrent link as argument.

# Prerequisites

The machine which will run the backend will need to have the following software installed:

- Node.js
- MongoDB
- a torrent client

# Installation

Clone the repository on the backend machine and run `npm install`:

    git clone git://github.com/furgerf/tv-show-torrent-downloader.git
    cd tv-show-torrent-downloader; npm install

# Backend configuration

The backend is configured in `./src/config.js`. Most configuration items depend on whether or not the system should run in a `productionEnvironment`. This flag is intended to facilitate development and should be set to `true` if the application should be
used. If it's set to `false`, no torrents are downloaded, logging is only written to STDOUT, and no changes are made to the database when downloading new episodes.

Notable configuration items are:

- `api.port`: port on which the backend is listening
- `database.host`: location of the MongoDB
- `torrentCommand`: command which starts torrents

# Running

Start the server by issuing

    npm start

# Frontend configuration

The web-frontend, which is reachable on the backend's address, contains an `Administration` tab where various settings can be changed and which also shows some information about the backend system.

