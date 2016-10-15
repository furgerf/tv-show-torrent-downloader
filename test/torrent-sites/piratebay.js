'use strict';

const root = './../../src/';

var expect = require('chai').expect,
  rewire = require('rewire'),

  testUtils = require('../test-utils'),
  Piratebay = rewire(root + 'torrent-sites/piratebay');

describe('torrent-sites/piratebay', function () {
  describe('constructor', function () {

    it('should throw an error if no URL is provided', function () {
      // must pass a function to expect that throws the exception
      expect(() => new Piratebay()).to.throw(Error);
    });
  });

  describe('static parse functions', function () {
    var parseSize = Piratebay.__get__('parseSize'),
      parseDateThisYear = Piratebay.__get__('parseDateThisYear'),
      parseDateLastYear = Piratebay.__get__('parseDateLastYear'),
      parseDateToday = Piratebay.__get__('parseDateToday'),
      parseDate = Piratebay.__get__('parseDate'),

      now = new Date();

    it('should correctly parse various valid sizes', function () {
      expect(parseSize(' 41.24&nbsp;KiB')).to.eql(41 * 1024);
      expect(parseSize(' 203.34&nbsp;MiB')).to.eql(203 * 1024 * 1024);
      expect(parseSize(' 24.89&nbsp;GiB')).to.eql(24 * 1024 * 1024 * 1024);
    });

    it('should correctly parse a valid date this year', function () {
      expect(parseDateThisYear(['foobar', '1', '2', '3', '4'])).to.eql(new Date(new Date().getFullYear(), 0, 2, 3, 4));
    });

    it('should correctly parse a valid date last year', function () {
      expect(parseDateLastYear(['foobar', '1', '2', '3'])).to.eql(new Date(1903, 0, 2));
    });

    it('should correctly parse a valid date today', function () {
      expect(parseDateToday(['foobar', '1', '2'])).to.eql(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1, 2));
    });

    it('should handle invalid date strings', function () {
      expect(parseDate('foobar')).to.be.null;
    });

    it('should correctly parse any valid date string', function () {
      // date last year
      expect(parseDate('02-15&nbsp;2013')).to.eql(new Date(2013, 1, 15));

      // date this year
      expect(parseDate('08-04&nbsp;06:11')).to.eql(new Date(now.getFullYear(), 7, 4, 6, 11));

      // date today
      expect(parseDate('Today&nbsp;14:35')).to.eql(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 35));
    });
  });

  describe('parseTorrentData', function () {
    var testee = new Piratebay('asdf', testUtils.getFakeLog()),
      htmlWithOneTorrent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>The Pirate Bay - The galaxy's most resilient bittorrent site</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="google-site-verification" content="bERYeomIC5eBWlPLupPPYPYGA9GvAUKzFHh3WIw24Xs" />
    <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Search The Pirate Bay" />
    <link rel="stylesheet" type="text/css" href="//thepiratebay.org/static/css/pirate6.css"/>
    <link rel="dns-prefetch" href="//syndication.exoclick.com/">
    <link rel="dns-prefetch" href="//main.exoclick.com/">
    <link rel="dns-prefetch" href="//static-ssl.exoclick.com/">
    <link rel="dns-prefetch" href="//ads.exoclick.com/">
    <link rel="canonical" href="//thepiratebay.org/search/mythical%20man%20month" />
    <style type="text/css">
        .searchBox{
            margin: 6px;
            width: 300px;
            vertical-align: middle;
            padding: 2px;
            background-image:url('//thepiratebay.org/static/img/icon-https.gif');
            background-repeat:no-repeat;
            background-position: right;
        }
        .detLink {
            font-size: 1.2em;
            font-weight: 400;
        }
        .detDesc {
            color: #4e5456;
        }
        .detDesc a:hover {
            color: #000099;
            text-decoration: underline;
        }
        .sortby {
            text-align: left;
            float: left;
        }
        .detName {
            padding-top: 3px;
            padding-bottom: 2px;
        }
        .viewswitch {
            font-style: normal;
            float: right;
            text-align: right;
            font-weight: normal;
        }
    </style>
    <script src="//thepiratebay.org/static/js/jquery.min.js" type="text/javascript"></script>
    <script src="//thepiratebay.org/static/js/tpb.js" type="text/javascript"></script>
    <meta name="description" content="Search for and download any torrent from the pirate bay using search query mythical man month. Direct download via magnet link."/>
    <meta name="keywords" content="mythical man month direct download torrent magnet tpb piratebay search"/>

    <script language="javascript" type="text/javascript">if (top.location != self.location) {top.location.replace(self.location);}</script>
</head>

<body>
    <div id="header">

        <form method="get" id="q" action="/s/">
            <a href="/" class="img"><img src="//thepiratebay.org/static/img/tpblogo_sm_ny.gif" id="TPBlogo" alt="The Pirate Bay" /></a>
            <b><a href="/" title="Search Torrents">Search Torrents</a></b>&nbsp;&nbsp;|&nbsp;
 <a href="/browse" title="Browse Torrents">Browse Torrents</a>&nbsp;&nbsp;|&nbsp;
 <a href="/recent" title="Recent Torrent">Recent Torrents</a>&nbsp;&nbsp;|&nbsp;
 <a href="/tv/" title="TV shows">TV shows</a>&nbsp;&nbsp;|&nbsp;
 <a href="/music" title="Music">Music</a>&nbsp;&nbsp;|&nbsp;
 <a href="/top" title="Top 100">Top 100</a>
            <br /><input type="search" class="inputbox" title="Pirate Search" name="q" placeholder="Search here..." value="mythical man month" /><input value="Pirate Search" type="submit" class="submitbutton"  /><br />            <label for="audio" title="Audio"><input id="audio" name="audio" onclick="javascript:rmAll();" type="checkbox"/>Audio</label>
            <label for="video" title="Video"><input id="video" name="video" onclick="javascript:rmAll();" type="checkbox"/>Video</label>
            <label for="apps" title="Applications"><input id="apps" name="apps" onclick="javascript:rmAll();" type="checkbox"/>Applications</label>
            <label for="games" title="Games"><input id="games" name="games" onclick="javascript:rmAll();" type="checkbox"/>Games</label>
            <label for="porn" title="Porn"><input id="porn" name="porn" onclick="javascript:rmAll();" type="checkbox"/>Porn</label>
            <label for="other" title="Other"><input id="other" name="other" onclick="javascript:rmAll();" type="checkbox"/>Other</label>

            <select id="category" name="category" onchange="javascript:setAll();">
                <option value="0">All</option>
                <optgroup label="Audio">
                    <option value="101">Music</option>
                    <option value="102">Audio books</option>
                    <option value="103">Sound clips</option>
                    <option value="104">FLAC</option>
                    <option value="199">Other</option>
                </optgroup>
                <optgroup label="Video">
                    <option value="201">Movies</option>
                    <option value="202">Movies DVDR</option>
                    <option value="203">Music videos</option>
                    <option value="204">Movie clips</option>
                    <option value="205">TV shows</option>
                    <option value="206">Handheld</option>
                    <option value="207">HD - Movies</option>
                    <option value="208">HD - TV shows</option>
                    <option value="209">3D</option>
                    <option value="299">Other</option>
                </optgroup>
                <optgroup label="Applications">
                    <option value="301">Windows</option>
                    <option value="302">Mac</option>
                    <option value="303">UNIX</option>
                    <option value="304">Handheld</option>
                    <option value="305">IOS (iPad/iPhone)</option>
                    <option value="306">Android</option>
                    <option value="399">Other OS</option>
                </optgroup>
                <optgroup label="Games">
                    <option value="401">PC</option>
                    <option value="402">Mac</option>
                    <option value="403">PSx</option>
                    <option value="404">XBOX360</option>
                    <option value="405">Wii</option>
                    <option value="406">Handheld</option>
                    <option value="407">IOS (iPad/iPhone)</option>
                    <option value="408">Android</option>
                    <option value="499">Other</option>
                </optgroup>
                <optgroup label="Porn">
                    <option value="501">Movies</option>
                    <option value="502">Movies DVDR</option>
                    <option value="503">Pictures</option>
                    <option value="504">Games</option>
                    <option value="505">HD - Movies</option>
                    <option value="506">Movie clips</option>
                    <option value="599">Other</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="601">E-books</option>
                    <option value="602">Comics</option>
                    <option value="603">Pictures</option>
                    <option value="604">Covers</option>
                    <option value="605">Physibles</option>
                    <option value="699">Other</option>
                </optgroup>
            </select>

            <input type="hidden" name="page" value="0" />
            <input type="hidden" name="orderby" value="99" />
        </form>
    </div><!-- // div:header -->

    <h2><span>Search results: mythical man month</span>&nbsp;Displaying hits from 0 to 1 (approx 1 found)</h2>

<div id="SearchResults"><div id="content">
			<div id="sky-right">
				 <iframe src="//thepiratebay.org/static/ads/exo_na/sky2.html" width="160" height="600" frameborder="0" scrolling="no"></iframe>
			</div>
	
		 <iframe src="//thepiratebay.org/static/ads/exo_na/center.html" id="sky-center" width="728" height="90" frameborder="0" scrolling="no"></iframe>
	<div id="main-content">
<table id="searchResult">
	<thead id="tableHead">
		<tr class="header">
			<th><a href="/search/mythical%20man%20month/0/13/0" title="Order by Type">Type</a></th>
			<th><div class="sortby"><a href="/search/mythical%20man%20month/0/1/0" title="Order by Name">Name</a> (Order by: <a href="/search/mythical%20man%20month/0/3/0" title="Order by Uploaded">Uploaded</a>, <a href="/search/mythical%20man%20month/0/5/0" title="Order by Size">Size</a>, <span style="white-space: nowrap;"><a href="/search/mythical%20man%20month/0/11/0" title="Order by ULed by">ULed by</a></span>, <a href="/search/mythical%20man%20month/0/8/0" title="Order by Seeders">SE</a>, <a href="/search/mythical%20man%20month/0/9/0" title="Order by Leechers">LE</a>)</div><div class="viewswitch"> View: <a href="/switchview.php?view=s">Single</a> / Double&nbsp;</div></th>
			<th><abbr title="Seeders"><a href="/search/mythical%20man%20month/0/8/0" title="Order by Seeders">SE</a></abbr></th>
			<th><abbr title="Leechers"><a href="/search/mythical%20man%20month/0/9/0" title="Order by Leechers">LE</a></abbr></th>
		</tr>
	</thead>
	<tr>
		<td class="vertTh">
			<center>
				<a href="/browse/600" title="More from this category">Other</a><br />
				(<a href="/browse/601" title="More from this category">E-books</a>)
			</center>
		</td>
		<td>
<div class="detName">			<a href="/torrent/6694643/The_mythical_man_month(real_book_not_some_30_page_bulshit)" class="detLink" title="Details for The mythical man month(real book not some 30 page bulshit)">The mythical man month(real book not some 30 page bulshit)</a>
</div>
<a href="magnet:?xt=urn:btih:615fd77dd50ed68a04354680222f18da17ebedbf&dn=The+mythical+man+month%28real+book+not+some+30+page+bulshit%29&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969" title="Download this torrent using magnet"><img src="//thepiratebay.org/static/img/icon-magnet.gif" alt="Magnet link" /></a><img src="//thepiratebay.org/static/img/icon_comment.gif" alt="This torrent has 5 comments." title="This torrent has 5 comments." /><img src="//thepiratebay.org/static/img/11x11p.png" />
			<font class="detDesc">Uploaded 09-22&nbsp;2011, Size 19.34&nbsp;MiB, ULed by <a class="detDesc" href="/user/mart_kl/" title="Browse mart_kl">mart_kl</a></font>
		</td>
		<td align="right">2</td>
		<td align="right">0</td>
	</tr>

</table>
</div>
<div align="center"></div>
			<div class="ads" id="sky-banner">
				 <iframe src="//thepiratebay.org/static/ads/exo_na/sky1.html" width="120" height="600" frameborder="0" scrolling="no"></iframe>
			</div>
			<script type="text/javascript" src="//thepiratebay.org/static/ads/ad-scroll.js"></script>
	</div></div></div><!-- //div:content -->

	<div id="foot" style="text-align:center;margin-top:1em;">

			 <iframe src="//thepiratebay.org/static/ads/exo_na/bottom.html" width="728" height="90" frameborder="0" scrolling="no"></iframe>
				<p>
			<a href="/login" title="Login">Login</a> | 
			<a href="/register" title="Register">Register</a> | 
			<a href="/language" title="Select language">Language / Select language</a> |
			<a href="/about" title="About">About</a> |
			<a href="/blog" title="Blog">Blog</a>
			<br />
			<!--<a href="/contact" title="Contact us">Contact us</a> |-->
			<a href="/policy" title="Usage policy">Usage policy</a> |
			<a href="http://uj3wazyk5u4hnvtk.onion" title="TOR">TOR</a> |
			<a href="/doodles" title="Doodles">Doodles</a> |
			<a href="http://pirates-forum.org/" title="Forum" target="_blank">Forum</a> 
			<br />
		</p>

<br /><a href="http://bitcoin.org" target="_NEW">BitCoin</a>: <b><a href="bitcoin:129TQVAroeehD9fZpzK51NdZGQT4TqifbG">129TQVAroeehD9fZpzK51NdZGQT4TqifbG</a></b><br /><br />

		<div id="fbanners">
			<a href="/rss" class="rss" title="RSS"><img src="//thepiratebay.org/static/img/rss_small.gif" alt="RSS" /></a>
		</div><!-- // div:fbanners -->
	</div><!-- // div:foot -->
</body>
</html>
    `,
      htmlWithSeveralTorrents = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>The Pirate Bay - The galaxy's most resilient bittorrent site</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="google-site-verification" content="bERYeomIC5eBWlPLupPPYPYGA9GvAUKzFHh3WIw24Xs" />
    <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Search The Pirate Bay" />
    <link rel="stylesheet" type="text/css" href="//thepiratebay.org/static/css/pirate6.css"/>
    <link rel="dns-prefetch" href="//syndication.exoclick.com/">
    <link rel="dns-prefetch" href="//main.exoclick.com/">
    <link rel="dns-prefetch" href="//static-ssl.exoclick.com/">
    <link rel="dns-prefetch" href="//ads.exoclick.com/">
    <link rel="canonical" href="//thepiratebay.org/search/suits%20s06e01%20720p" />
    <style type="text/css">
        .searchBox{
            margin: 6px;
            width: 300px;
            vertical-align: middle;
            padding: 2px;
            background-image:url('//thepiratebay.org/static/img/icon-https.gif');
            background-repeat:no-repeat;
            background-position: right;
        }
        .detLink {
            font-size: 1.2em;
            font-weight: 400;
        }
        .detDesc {
            color: #4e5456;
        }
        .detDesc a:hover {
            color: #000099;
            text-decoration: underline;
        }
        .sortby {
            text-align: left;
            float: left;
        }
        .detName {
            padding-top: 3px;
            padding-bottom: 2px;
        }
        .viewswitch {
            font-style: normal;
            float: right;
            text-align: right;
            font-weight: normal;
        }
    </style>
    <script src="//thepiratebay.org/static/js/jquery.min.js" type="text/javascript"></script>
    <script src="//thepiratebay.org/static/js/tpb.js" type="text/javascript"></script>
    <meta name="description" content="Search for and download any torrent from the pirate bay using search query suits s06e01 720p. Direct download via magnet link."/>
    <meta name="keywords" content="suits s06e01 720p direct download torrent magnet tpb piratebay search"/>

    <script language="javascript" type="text/javascript">if (top.location != self.location) {top.location.replace(self.location);}</script>
</head>

<body>
    <div id="header">

        <form method="get" id="q" action="/s/">
            <a href="/" class="img"><img src="//thepiratebay.org/static/img/tpblogo_sm_ny.gif" id="TPBlogo" alt="The Pirate Bay" /></a>
            <b><a href="/" title="Search Torrents">Search Torrents</a></b>&nbsp;&nbsp;|&nbsp;
 <a href="/browse" title="Browse Torrents">Browse Torrents</a>&nbsp;&nbsp;|&nbsp;
 <a href="/recent" title="Recent Torrent">Recent Torrents</a>&nbsp;&nbsp;|&nbsp;
 <a href="/tv/" title="TV shows">TV shows</a>&nbsp;&nbsp;|&nbsp;
 <a href="/music" title="Music">Music</a>&nbsp;&nbsp;|&nbsp;
 <a href="/top" title="Top 100">Top 100</a>
            <br /><input type="search" class="inputbox" title="Pirate Search" name="q" placeholder="Search here..." value="suits s06e01 720p" /><input value="Pirate Search" type="submit" class="submitbutton"  /><br />            <label for="audio" title="Audio"><input id="audio" name="audio" onclick="javascript:rmAll();" type="checkbox"/>Audio</label>
            <label for="video" title="Video"><input id="video" name="video" onclick="javascript:rmAll();" type="checkbox"/>Video</label>
            <label for="apps" title="Applications"><input id="apps" name="apps" onclick="javascript:rmAll();" type="checkbox"/>Applications</label>
            <label for="games" title="Games"><input id="games" name="games" onclick="javascript:rmAll();" type="checkbox"/>Games</label>
            <label for="porn" title="Porn"><input id="porn" name="porn" onclick="javascript:rmAll();" type="checkbox"/>Porn</label>
            <label for="other" title="Other"><input id="other" name="other" onclick="javascript:rmAll();" type="checkbox"/>Other</label>

            <select id="category" name="category" onchange="javascript:setAll();">
                <option value="0">All</option>
                <optgroup label="Audio">
                    <option value="101">Music</option>
                    <option value="102">Audio books</option>
                    <option value="103">Sound clips</option>
                    <option value="104">FLAC</option>
                    <option value="199">Other</option>
                </optgroup>
                <optgroup label="Video">
                    <option value="201">Movies</option>
                    <option value="202">Movies DVDR</option>
                    <option value="203">Music videos</option>
                    <option value="204">Movie clips</option>
                    <option value="205">TV shows</option>
                    <option value="206">Handheld</option>
                    <option value="207">HD - Movies</option>
                    <option value="208">HD - TV shows</option>
                    <option value="209">3D</option>
                    <option value="299">Other</option>
                </optgroup>
                <optgroup label="Applications">
                    <option value="301">Windows</option>
                    <option value="302">Mac</option>
                    <option value="303">UNIX</option>
                    <option value="304">Handheld</option>
                    <option value="305">IOS (iPad/iPhone)</option>
                    <option value="306">Android</option>
                    <option value="399">Other OS</option>
                </optgroup>
                <optgroup label="Games">
                    <option value="401">PC</option>
                    <option value="402">Mac</option>
                    <option value="403">PSx</option>
                    <option value="404">XBOX360</option>
                    <option value="405">Wii</option>
                    <option value="406">Handheld</option>
                    <option value="407">IOS (iPad/iPhone)</option>
                    <option value="408">Android</option>
                    <option value="499">Other</option>
                </optgroup>
                <optgroup label="Porn">
                    <option value="501">Movies</option>
                    <option value="502">Movies DVDR</option>
                    <option value="503">Pictures</option>
                    <option value="504">Games</option>
                    <option value="505">HD - Movies</option>
                    <option value="506">Movie clips</option>
                    <option value="599">Other</option>
                </optgroup>
                <optgroup label="Other">
                    <option value="601">E-books</option>
                    <option value="602">Comics</option>
                    <option value="603">Pictures</option>
                    <option value="604">Covers</option>
                    <option value="605">Physibles</option>
                    <option value="699">Other</option>
                </optgroup>
            </select>

            <input type="hidden" name="page" value="0" />
            <input type="hidden" name="orderby" value="99" />
        </form>
    </div><!-- // div:header -->

    <h2><span>Search results: suits s06e01 720p</span>&nbsp;Displaying hits from 0 to 4 (approx 4 found)</h2>

<div id="SearchResults"><div id="content">
			<div id="sky-right">
				 <iframe src="//thepiratebay.org/static/ads/exo_na/sky2.html" width="160" height="600" frameborder="0" scrolling="no"></iframe>
			</div>
	
		 <iframe src="//thepiratebay.org/static/ads/exo_na/center.html" id="sky-center" width="728" height="90" frameborder="0" scrolling="no"></iframe>
	<div id="main-content">
<table id="searchResult">
	<thead id="tableHead">
		<tr class="header">
			<th><a href="/search/suits%20s06e01%20720p/0/13/0" title="Order by Type">Type</a></th>
			<th><div class="sortby"><a href="/search/suits%20s06e01%20720p/0/1/0" title="Order by Name">Name</a> (Order by: <a href="/search/suits%20s06e01%20720p/0/3/0" title="Order by Uploaded">Uploaded</a>, <a href="/search/suits%20s06e01%20720p/0/5/0" title="Order by Size">Size</a>, <span style="white-space: nowrap;"><a href="/search/suits%20s06e01%20720p/0/11/0" title="Order by ULed by">ULed by</a></span>, <a href="/search/suits%20s06e01%20720p/0/8/0" title="Order by Seeders">SE</a>, <a href="/search/suits%20s06e01%20720p/0/9/0" title="Order by Leechers">LE</a>)</div><div class="viewswitch"> View: <a href="/switchview.php?view=s">Single</a> / Double&nbsp;</div></th>
			<th><abbr title="Seeders"><a href="/search/suits%20s06e01%20720p/0/8/0" title="Order by Seeders">SE</a></abbr></th>
			<th><abbr title="Leechers"><a href="/search/suits%20s06e01%20720p/0/9/0" title="Order by Leechers">LE</a></abbr></th>
		</tr>
	</thead>
	<tr>
		<td class="vertTh">
			<center>
				<a href="/browse/200" title="More from this category">Video</a><br />
				(<a href="/browse/208" title="More from this category">HD - TV shows</a>)
			</center>
		</td>
		<td>
<div class="detName">			<a href="/torrent/15299408/Suits.S06E01.720p.HDTV.x264-KILLERS[ettv]" class="detLink" title="Details for Suits.S06E01.720p.HDTV.x264-KILLERS[ettv]">Suits.S06E01.720p.HDTV.x264-KILLERS[ettv]</a>
</div>
<a href="magnet:?xt=urn:btih:645e43e0e1f152b50503a21aede80d59a784e548&dn=Suits.S06E01.720p.HDTV.x264-KILLERS%5Bettv%5D&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969" title="Download this torrent using magnet"><img src="//thepiratebay.org/static/img/icon-magnet.gif" alt="Magnet link" /></a><a href="//cdn.bitx.tv/bx.php?torrent=bWFnbmV0Oj94dD11cm46YnRpaDo2NDVlNDNlMGUxZjE1MmI1MDUwM2EyMWFlZGU4MGQ1OWE3ODRlNTQ4JmRuPVN1aXRzLlMwNkUwMS43MjBwLkhEVFYueDI2NC1LSUxMRVJTJTVCZXR0diU1RCZ0cj11ZHAlM0ElMkYlMkZ0cmFja2VyLmxlZWNoZXJzLXBhcmFkaXNlLm9yZyUzQTY5NjkmdHI9dWRwJTNBJTJGJTJGemVyMGRheS5jaCUzQTEzMzcmdHI9dWRwJTNBJTJGJTJGb3Blbi5kZW1vbmlpLmNvbSUzQTEzMzcmdHI9dWRwJTNBJTJGJTJGdHJhY2tlci5jb3BwZXJzdXJmZXIudGslM0E2OTY5JnRyPXVkcCUzQSUyRiUyRmV4b2R1cy5kZXN5bmMuY29tJTNBNjk2OQ==&affid=1337&imdb=" target="_blank" title="Play now using BitX"><img src="//thepiratebay.org/static/img/icons/icon-bitx.png" alt="Play link" /></a><a href="/user/EtHD"><img src="//thepiratebay.org/static/img/vip.gif" alt="VIP" title="VIP" style="width:11px;" border='0' /></a><img src="//thepiratebay.org/static/img/11x11p.png" />
			<font class="detDesc">Uploaded 07-14&nbsp;04:03, Size 680.33&nbsp;MiB, ULed by <a class="detDesc" href="/user/EtHD/" title="Browse EtHD">EtHD</a></font>
		</td>
		<td align="right">123</td>
		<td align="right">5</td>
	</tr>
	<tr class="alt">
		<td class="vertTh">
			<center>
				<a href="/browse/200" title="More from this category">Video</a><br />
				(<a href="/browse/208" title="More from this category">HD - TV shows</a>)
			</center>
		</td>
		<td>
<div class="detName">			<a href="/torrent/15299961/Suits_S06E01_720p_HDTV_x265_HEVC_200MB_-_ShAaNiG" class="detLink" title="Details for Suits S06E01 720p HDTV x265 HEVC 200MB - ShAaNiG">Suits S06E01 720p HDTV x265 HEVC 200MB - ShAaNiG</a>
</div>
<a href="magnet:?xt=urn:btih:c31c387178eccda2f88882e839a6ae435964d867&dn=Suits+S06E01+720p+HDTV+x265+HEVC+200MB+-+ShAaNiG&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969" title="Download this torrent using magnet"><img src="//thepiratebay.org/static/img/icon-magnet.gif" alt="Magnet link" /></a><a href="/user/ShAaNiG"><img src="//thepiratebay.org/static/img/vip.gif" alt="VIP" title="VIP" style="width:11px;" border='0' /></a><img src="//thepiratebay.org/static/img/11x11p.png" />
			<font class="detDesc">Uploaded 07-14&nbsp;05:18, Size 200.23&nbsp;MiB, ULed by <a class="detDesc" href="/user/ShAaNiG/" title="Browse ShAaNiG">ShAaNiG</a></font>
		</td>
		<td align="right">9</td>
		<td align="right">5</td>
	</tr>
	<tr>
		<td class="vertTh">
			<center>
				<a href="/browse/200" title="More from this category">Video</a><br />
				(<a href="/browse/208" title="More from this category">HD - TV shows</a>)
			</center>
		</td>
		<td>
<div class="detName">			<a href="/torrent/15300180/Suits.S06E01.720p.HDTV.x265-GIRAYS.mkv" class="detLink" title="Details for Suits.S06E01.720p.HDTV.x265-GIRAYS.mkv">Suits.S06E01.720p.HDTV.x265-GIRAYS.mkv</a>
</div>
<a href="magnet:?xt=urn:btih:db9a64d2643fad96fe772a7056785145b4f60ace&dn=Suits.S06E01.720p.HDTV.x265-GIRAYS.mkv&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969" title="Download this torrent using magnet"><img src="//thepiratebay.org/static/img/icon-magnet.gif" alt="Magnet link" /></a><a href="/user/insane86"><img src="//thepiratebay.org/static/img/trusted.png" alt="Trusted" title="Trusted" style="width:11px;" border='0' /></a><img src="//thepiratebay.org/static/img/11x11p.png" />
			<font class="detDesc">Uploaded 07-14&nbsp;05:36, Size 230.03&nbsp;MiB, ULed by <a class="detDesc" href="/user/insane86/" title="Browse insane86">insane86</a></font>
		</td>
		<td align="right">1</td>
		<td align="right">0</td>
	</tr>
	<tr class="alt">
		<td class="vertTh">
			<center>
				<a href="/browse/200" title="More from this category">Video</a><br />
				(<a href="/browse/205" title="More from this category">TV shows</a>)
			</center>
		</td>
		<td>
<div class="detName">			<a href="/torrent/15309531/Suits.S06E01.720p.HEVC.x265-MeGusta" class="detLink" title="Details for Suits.S06E01.720p.HEVC.x265-MeGusta">Suits.S06E01.720p.HEVC.x265-MeGusta</a>
</div>
<a href="magnet:?xt=urn:btih:c111e985df650afb3f1ac2e9f387a9143f59adc5&dn=Suits.S06E01.720p.HEVC.x265-MeGusta&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969" title="Download this torrent using magnet"><img src="//thepiratebay.org/static/img/icon-magnet.gif" alt="Magnet link" /></a><a href="/user/TvTeam"><img src="//thepiratebay.org/static/img/vip.gif" alt="VIP" title="VIP" style="width:11px;" border='0' /></a><img src="//thepiratebay.org/static/img/11x11p.png" />
			<font class="detDesc">Uploaded 07-15&nbsp;07:49, Size 204.45&nbsp;MiB, ULed by <a class="detDesc" href="/user/TvTeam/" title="Browse TvTeam">TvTeam</a></font>
		</td>
		<td align="right">0</td>
		<td align="right">0</td>
	</tr>

</table>
</div>
<div align="center"></div>
			<div class="ads" id="sky-banner">
				 <iframe src="//thepiratebay.org/static/ads/exo_na/sky1.html" width="120" height="600" frameborder="0" scrolling="no"></iframe>
			</div>
			<script type="text/javascript" src="//thepiratebay.org/static/ads/ad-scroll.js"></script>
	</div></div></div><!-- //div:content -->

	<div id="foot" style="text-align:center;margin-top:1em;">

			 <iframe src="//thepiratebay.org/static/ads/exo_na/bottom.html" width="728" height="90" frameborder="0" scrolling="no"></iframe>
				<p>
			<a href="/login" title="Login">Login</a> | 
			<a href="/register" title="Register">Register</a> | 
			<a href="/language" title="Select language">Language / Select language</a> |
			<a href="/about" title="About">About</a> |
			<a href="/blog" title="Blog">Blog</a>
			<br />
			<!--<a href="/contact" title="Contact us">Contact us</a> |-->
			<a href="/policy" title="Usage policy">Usage policy</a> |
			<a href="http://uj3wazyk5u4hnvtk.onion" title="TOR">TOR</a> |
			<a href="/doodles" title="Doodles">Doodles</a> |
			<a href="http://pirates-forum.org/" title="Forum" target="_blank">Forum</a> 
			<br />
		</p>

<br /><a href="http://bitcoin.org" target="_NEW">BitCoin</a>: <b><a href="bitcoin:129TQVAroeehD9fZpzK51NdZGQT4TqifbG">129TQVAroeehD9fZpzK51NdZGQT4TqifbG</a></b><br /><br />

		<div id="fbanners">
			<a href="/rss" class="rss" title="RSS"><img src="//thepiratebay.org/static/img/rss_small.gif" alt="RSS" /></a>
		</div><!-- // div:fbanners -->
	</div><!-- // div:foot -->
</body>
</html>
    `;

    it('should handle invalid data', function () {
      expect(testee.parseTorrentData()).to.be.null;
      expect(testee.parseTorrentData(123)).to.be.null;
      expect(testee.parseTorrentData({})).to.be.null;
      expect(testee.parseTorrentData([])).to.be.null;
    });

    it('should handle data without torrents', function () {
      expect(testee.parseTorrentData('asdf')).to.eql([]);
    });

    it('should correctly parse html data with one torrent', function () {
      expect(testee.parseTorrentData(htmlWithOneTorrent, 12, 34)).to.eql([{
        name: 'The mythical man month(real book not some 30 page bulshit)',
        season: 12,
        episode: 34,
        seeders: 2,
        leechers: 0,
        size: 19922944,
        uploadDate: new Date(2011, 8, 22),
        link: 'magnet:?xt=urn:btih:615fd77dd50ed68a04354680222f18da17ebedbf&dn=The+mythical+man+month(real+book+not+some+30+page+bulshit)&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969'
      }]);
    });

    it('should correctly parse html data with multiple torrents', function () {
      expect(testee.parseTorrentData(htmlWithSeveralTorrents, 12, 34)).to.eql([{
        name: 'Suits.S06E01.720p.HDTV.x264-KILLERS[ettv]',
        season: 12,
        episode: 34,
        seeders: 123,
        leechers: 5,
        size: 713031680,
        uploadDate: new Date(2016, 6, 14, 4, 3),
        link: 'magnet:?xt=urn:btih:645e43e0e1f152b50503a21aede80d59a784e548&dn=Suits.S06E01.720p.HDTV.x264-KILLERS[ettv]&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969' },
        { name: 'Suits S06E01 720p HDTV x265 HEVC 200MB - ShAaNiG',
          season: 12,
          episode: 34,
          seeders: 9,
          leechers: 5,
          size: 209715200,
          uploadDate: new Date(2016, 6, 14, 5, 18),
          link: 'magnet:?xt=urn:btih:c31c387178eccda2f88882e839a6ae435964d867&dn=Suits+S06E01+720p+HDTV+x265+HEVC+200MB+-+ShAaNiG&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969' },
        { name: 'Suits.S06E01.720p.HDTV.x265-GIRAYS.mkv',
          season: 12,
          episode: 34,
          seeders: 1,
          leechers: 0,
          size: 241172480,
          uploadDate: new Date(2016, 6, 14, 5, 36),
          link: 'magnet:?xt=urn:btih:db9a64d2643fad96fe772a7056785145b4f60ace&dn=Suits.S06E01.720p.HDTV.x265-GIRAYS.mkv&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969' },
        { name: 'Suits.S06E01.720p.HEVC.x265-MeGusta',
          season: 12,
          episode: 34,
          seeders: 0,
          leechers: 0,
          size: 213909504,
          uploadDate: new Date(2016, 6, 15, 7, 49),
          link: 'magnet:?xt=urn:btih:c111e985df650afb3f1ac2e9f387a9143f59adc5&dn=Suits.S06E01.720p.HEVC.x265-MeGusta&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969'
        }]);
    });
  });
});

