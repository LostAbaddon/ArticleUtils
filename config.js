window.DefaultExtConfig = {
	"AutoMath": true,
	"AutoSearch": true,
	"ShowSearchNotify": true,
	"HideWeakResults": true,
	"ResourceExpire": 48,
	"ResourceGCInterval": 12,
	"ResourceCacheLimit": 500,
	"BackendServer": {
		"host": "127.0.0.1",
		"port": 8001
	},
	"DefaultSearchEngine": {
		"article": true,
		"book": true,
		"pedia": true,
		"video": false,
		"news": false,
		"common": true
	},
	"IgnoreList": [
		{
			"url": "google.com",
			"using": true
		},
		{
			"url": "baidu.com",
			"using": true
		},
		{
			"url": "bing.com",
			"using": true
		},
		{
			"url": "shuge.org",
			"using": true
		},
		{
			"url": "epubw.com",
			"using": true
		},
		{
			"url": "lingocn.com",
			"using": true
		},
		{
			"url": "txtbook.com",
			"using": true
		},
		{
			"url": "ituring.com",
			"using": true
		},
		{
			"url": "booksc.xyz",
			"using": true
		},
		{
			"url": "epubee.com",
			"using": true
		}
	],
	"SilenceRules": {
		"book.douban.com/subject": {
			"article": true,
			"book": true,
			"pedia": false,
			"video": false,
			"news": false,
			"common": true
		},
		"github.com/LostAbaddon": {
			"article": true,
			"book": true,
			"pedia": false,
			"video": false,
			"news": false,
			"common": true
		},
		"read.douban.com/": {
			"article": true,
			"book": true,
			"pedia": false,
			"video": false,
			"news": false,
			"common": true
		},
		"read.douban.com/reader": {
			"article": true,
			"book": true,
			"pedia": false,
			"video": false,
			"news": false,
			"common": true
		},
		"www.douban.com/": {
			"article": true,
			"book": true,
			"pedia": true,
			"video": true,
			"news": false,
			"common": true
		}
	},
	"CommonSource": [
		{
			"name": "谷歌",
			"url": "https://www.google.com/search?q={title}",
			"connector": "+",
			"container": "#search div.g div.r > a",
			"title": "h3",
			"using": true
		},
		{
			"name": "百度",
			"url": "https://www.baidu.com/s?ie=utf-8&wd={title}",
			"connector": "%20",
			"container": "#content_left div h3 > a:first-child",
			"using": true
		},
		{
			"name": "必应",
			"url": "https://www.bing.com/search?q={title}",
			"connector": "+",
			"container": "#b_results li h2 > a",
			"using": true
		}
	],
	"ArticleSource": [
		{
			"name": "简书",
			"url": "https://www.jianshu.com/search?q={title}&type=note",
			"connector": "%20",
			"container": "div.row div.search-content ul li div.content a.title",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "豆瓣",
			"url": "https://www.douban.com/search?cat=1015&q={title}",
			"connector": "%20",
			"container": "div.result-list div.result div.content div.title a",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "知乎",
			"url": "https://www.zhihu.com/search?type=content&q={title}",
			"connector": "%20",
			"container": "div.Search-container div.List div.SearchResult-Card div.List-item h2.ContentItem-title a",
			"title": "span",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "Medium",
			"url": "https://medium.com/search?q={title}",
			"connector": "%20",
			"container": "div[data-source=search_post] div.postArticle-content a",
			"title": "h3",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "Matters",
			"url": "https://matters.news/search?q={title}",
			"connector": "%20",
			"container": "main section article section[role=listitem] section.title a",
			"title": "h2.title",
			"chinese": true,
			"english": true,
			"using": true
		}
	],
	"BookSource": [
		{
			"name": "ePUBw",
			"url": "https://epubw.com/?s={title}",
			"connector": "+",
			"container": "section.container div.content div.row.equal article div.caption p:first-child a",
			"redirect": "epubw\\.com\\/\\d+\\.html",
			"chinese": true,
			"english": false,
			"using": false
		},
		{
			"name": "好资源",
			"url": "http://www.lingocn.com/?s={title}",
			"connector": "+",
			"container": "div.post-list div.simplebar-mask div.simplebar-content article a.entry-title",
			"chinese": true,
			"english": false,
			"using": true
		},
		{
			"name": "乐读电子书",
			"url": "http://www.txtbook.com.cn/search?keyword={title}",
			"connector": "+",
			"container": "table > tbody td.downCont > a[href^=\"/\"]",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "图灵社区",
			"url": "https://www.ituring.com.cn/search?q={title}",
			"connector": "+",
			"container": "div#search-result-books ul.block-items li.block-item h4.name a",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "ZLibrary",
			"url": "https://booksc.xyz/s/{title}",
			"connector": "%20",
			"form": "",
			"container": "table tbody td h3 a",
			"chinese": false,
			"english": true,
			"using": true
		},
		{
			"name": "书格",
			"url": "https://new.shuge.org/?s={title}",
			"connector": "+",
			"container": "article header h2 a",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "ePUBee",
			"url": "http://cn.epubee.com/books/?s={title}",
			"connector": "%20",
			"container": "div#get_ebook_list div.ebookitem div.list_title a",
			"chinese": true,
			"english": false,
			"using": true
		}
	],
	"PediaSource": [
		{
			"name": "中文维基",
			"url": "https://zh.wikipedia.org/w/index.php?search={title}",
			"connector": "+",
			"container": "div#content div#bodyContent div.searchresults ul.mw-search-results li.mw-search-result div.mw-search-result-heading a",
			"chinese": true,
			"english": false,
			"using": true
		},
		{
			"name": "英文维基",
			"url": "https://en.wikipedia.org/w/index.php?search={title}",
			"connector": "+",
			"container": "div#content div#bodyContent div.searchresults ul.mw-search-results li.mw-search-result div.mw-search-result-heading a",
			"chinese": false,
			"english": true,
			"using": true
		},
		{
			"name": "松鼠会",
			"url": "https://songshuhui.net/?s={title}",
			"connector": "+",
			"container": "div#wrapper div#content div.step div h3.storytitle a",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "Nature",
			"url": "https://www.nature.com/subjects/{title}",
			"connector": "-",
			"container": "div.grid ul li article h3 a",
			"chinese": false,
			"english": true,
			"using": true
		},
		{
			"name": "Science",
			"url": "https://search.sciencemag.org/?searchTerm={title}",
			"connector": "%20",
			"container": "div.super-search div.ss-container ul.headline-list li div.media div.media__body h2.media__headline a",
			"chinese": false,
			"english": true,
			"using": true
		}
	],
	"VideoSource": [
		{
			"name": "BT电影",
			"url": "http://www.btbtdy.la/search/{title}.html",
			"connector": "%20",
			"container": "div.list_so dl dd a",
			"using": true
		},
		{
			"name": "91美剧网",
			"url": "https://91mjw.com/?s={title}",
			"connector": "+",
			"container": "section.container div.content div.m-movies article > a",
			"title": "h2",
			"using": true
		},
		{
			"name": "高清电影",
			"url": "https://gaoqing.la/?s={title}",
			"connector": "+",
			"container": "div.container ul li.post div.article h2 a",
			"using": true
		},
		{
			"name": "B站视频",
			"url": "https://search.bilibili.com/video?keyword={title}",
			"connector": "%20",
			"container": "div#server-search-app ul.video-list li.video-item div.headline a.title",
			"using": true
		},
		{
			"name": "B站番剧",
			"url": "https://search.bilibili.com/bangumi?keyword={title}",
			"connector": "%20",
			"container": "div#bangumi-list ul li.bangumi-item div.bangumi-item-wrap div.headline a.title",
			"using": true
		},
		{
			"name": "B站影视",
			"url": "https://search.bilibili.com/pgc?keyword={title}",
			"connector": "%20",
			"container": "div#server-search-app div.contain div.body-contain ul li.pgc-item div.pgc-item-wrap div.headline a.title",
			"using": true
		},
		{
			"name": "A站视频",
			"url": "https://www.acfun.cn/search/?#query={title};type=video",
			"connector": "%20",
			"container": "div.main section.wp div.column-left div.list-wrap div.search-result-list div.cell div.video-cell-right div.title a.contentItem",
			"using": true
		},
		{
			"name": "A站番剧",
			"url": "https://www.acfun.cn/search/?#query={title};type=bangumi",
			"connector": "%20",
			"container": "div.main section.wp div.column-left div.list-wrap div.search-result-list div.cell div.bangumi-cell-right div.title a.contentItem",
			"using": true
		}
	],
	"NewsSource": [
		{
			"name": "谷歌新闻",
			"url": "https://news.google.com/search?q={title}",
			"connector": "%20",
			"container": "body > c-wiz > div > div > div > div > main > c-wiz > div > div > div > article > h3 > a[href]",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "百度新闻",
			"url": "https://www.baidu.com/s?tn=news&word={title}",
			"connector": "%20",
			"container": "#content_left div.result h3.c-title > a",
			"chinese": true,
			"english": true,
			"using": true
		},
		{
			"name": "财新",
			"url": "http://search.caixin.com/search/search.jsp?keyword={title}&channel=0",
			"connector": "+",
			"container": "div.searchbox div.searchboxCon div.searchboxR div.searchtext ul li div.searchxt a",
			"chinese": true,
			"english": false,
			"using": true
		},
		{
			"name": "BBC",
			"url": "https://www.bbc.co.uk/search?q={title}&filter=news",
			"connector": "+",
			"container": "section.search-content ol.search-results li article > div > h1 > a",
			"chinese": false,
			"english": true,
			"using": true
		},
		{
			"name": "CNN",
			"url": "https://edition.cnn.com/search?q={title}",
			"connector": "+",
			"container": "div.cnn-search div.l-container div.cnn-search__results div.cnn-search__results-list div.cnn-search__result div.cnn-search__result-contents h3.cnn-search__result-headline a",
			"chinese": false,
			"english": true,
			"using": true
		}
	]
};