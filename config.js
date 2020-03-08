window.DefaultExtConfig = {
	"AutoMath": true,
	"AutoSearch": true,
	"ShowSearchNotify": false,
	"HideWeakResults": false,
	"ResourceExpire": 48,
	"ResourceGCInterval": 6,
	"ResourceCacheLimit": 500,
	"DefaultSearchEngine": {
		"article": true,
		"book": true,
		"pedia": true,
		"video": true,
		"news": true,
		"common": true,
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
			"common": true,
			"news": false,
			"pedia": false,
			"video": false
		},
		"github.com/LostAbaddon": {
			"article": true,
			"book": true,
			"common": true,
			"news": false,
			"pedia": false,
			"video": false
		},
		"read.douban.com/": {
			"article": true,
			"book": true,
			"common": true,
			"news": false,
			"pedia": false,
			"video": false
		},
		"read.douban.com/reader": {
			"article": true,
			"book": true,
			"common": true,
			"news": false,
			"pedia": false,
			"video": false
		}
	},
	"CommonSource": [
		{
			"connector": "+",
			"container": "#search div.g div.r > a",
			"name": "谷歌",
			"title": "h3",
			"url": "https://www.google.com/search?q={title}",
			"using": true
		},
		{
			"connector": "%20",
			"container": "#content_left div h3 > a:first-child",
			"name": "百度",
			"url": "https://www.baidu.com/s?ie=utf-8&wd={title}",
			"using": true
		},
		{
			"connector": "+",
			"container": "#b_results li h2 > a",
			"name": "必应",
			"url": "https://www.bing.com/search?q={title}",
			"using": true
		}
	],
	"ArticleSource": [
		{
			"chinese": true,
			"connector": "%20",
			"container": "div.row div.search-content ul li div.content a.title",
			"english": true,
			"name": "简书",
			"url": "https://www.jianshu.com/search?q={title}&type=note",
			"using": true
		},
		{
			"chinese": true,
			"connector": "%20",
			"container": "div.result-list div.result div.content div.title a",
			"english": true,
			"name": "豆瓣",
			"url": "https://www.douban.com/search?cat=1015&q={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "%20",
			"container": "div.Search-container div.List div.SearchResult-Card div.List-item h2.ContentItem-title a",
			"english": true,
			"name": "知乎",
			"title": "span",
			"url": "https://www.zhihu.com/search?type=content&q={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "%20",
			"container": "div[data-source=search_post] div.postArticle-content a",
			"english": true,
			"name": "Medium",
			"title": "h3",
			"url": "https://medium.com/search?q={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "%20",
			"container": "main section article section[role=listitem] section.title a",
			"english": true,
			"name": "Matters",
			"title": "h2.title",
			"url": "https://matters.news/search?q={title}",
			"using": true
		}
	],
	"BookSource": [
		{
			"chinese": true,
			"connector": "+",
			"container": "section.container div.content div.row.equal article div.caption p:first-child a",
			"english": false,
			"name": "ePUBw",
			"redirect": "epubw\\.com\\/\\d+\\.html",
			"url": "https://epubw.com/?s={title}",
			"using": false
		},
		{
			"chinese": true,
			"connector": "+",
			"container": "div.post-list div.simplebar-mask div.simplebar-content article a.entry-title",
			"english": false,
			"name": "好资源",
			"url": "http://www.lingocn.com/?s={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "+",
			"container": "table > tbody td.downCont > a[href^=\"/\"]",
			"english": true,
			"name": "乐读电子书",
			"url": "http://www.txtbook.com.cn/search?keyword={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "+",
			"container": "div#search-result-books ul.block-items li.block-item h4.name a",
			"english": true,
			"name": "图灵社区",
			"url": "https://www.ituring.com.cn/search?q={title}",
			"using": true
		},
		{
			"chinese": false,
			"connector": "%20",
			"container": "table tbody td h3 a",
			"english": true,
			"form": "",
			"name": "ZLibrary",
			"url": "https://booksc.xyz/s/{title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "+",
			"container": "article header h2 a",
			"english": true,
			"name": "书格",
			"url": "https://new.shuge.org/?s={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "%20",
			"container": "div#get_ebook_list div.ebookitem div.list_title a",
			"english": false,
			"name": "ePUBee",
			"url": "http://cn.epubee.com/books/?s={title}",
			"using": true
		}
	],
	"PediaSource": [
		{
			"chinese": true,
			"connector": "+",
			"container": "div#content div#bodyContent div.searchresults ul.mw-search-results li.mw-search-result div.mw-search-result-heading a",
			"english": false,
			"name": "中文维基",
			"url": "https://zh.wikipedia.org/w/index.php?search={title}",
			"using": true
		},
		{
			"chinese": false,
			"connector": "+",
			"container": "div#content div#bodyContent div.searchresults ul.mw-search-results li.mw-search-result div.mw-search-result-heading a",
			"english": true,
			"name": "英文维基",
			"url": "https://en.wikipedia.org/w/index.php?search={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "+",
			"container": "div#wrapper div#content div.step div h3.storytitle a",
			"english": true,
			"name": "松鼠会",
			"url": "https://songshuhui.net/?s={title}",
			"using": true
		},
		{
			"chinese": false,
			"connector": "-",
			"container": "div.grid ul li article h3 a",
			"english": true,
			"name": "Nature",
			"url": "https://www.nature.com/subjects/{title}",
			"using": true
		},
		{
			"chinese": false,
			"connector": "%20",
			"container": "div.super-search div.ss-container ul.headline-list li div.media div.media__body h2.media__headline a",
			"english": true,
			"name": "Science",
			"url": "https://search.sciencemag.org/?searchTerm={title}",
			"using": true
		}
	],
	"VideoSource": [
		{
			"connector": "%20",
			"container": "div.list_so dl dd a",
			"name": "BT电影",
			"url": "http://www.btbtdy.la/search/{title}.html",
			"using": true
		},
		{
			"connector": "+",
			"container": "section.container div.content div.m-movies article > a",
			"name": "91美剧网",
			"title": "h2",
			"url": "https://91mjw.com/?s={title}",
			"using": true
		},
		{
			"connector": "+",
			"container": "div.container ul li.post div.article h2 a",
			"name": "高清电影",
			"url": "https://gaoqing.la/?s={title}",
			"using": true
		}
	],
	"NewsSource": [
		{
			"chinese": true,
			"connector": "%20",
			"container": "body > c-wiz > div > div > div > div > main > c-wiz > div > div > div > article > h3 > a[href]",
			"english": true,
			"name": "谷歌新闻",
			"url": "https://news.google.com/search?q={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "%20",
			"container": "#content_left div.result h3.c-title > a",
			"english": true,
			"name": "百度新闻",
			"url": "https://www.baidu.com/s?tn=news&word={title}",
			"using": true
		},
		{
			"chinese": true,
			"connector": "+",
			"container": "div.searchbox div.searchboxCon div.searchboxR div.searchtext ul li div.searchxt a",
			"english": false,
			"name": "财新",
			"url": "http://search.caixin.com/search/search.jsp?keyword={title}&channel=0",
			"using": true
		},
		{
			"chinese": false,
			"connector": "+",
			"container": "section.search-content ol.search-results li article > div > h1 > a",
			"english": true,
			"name": "BBC",
			"url": "https://www.bbc.co.uk/search?q={title}&filter=news",
			"using": true
		},
		{
			"chinese": false,
			"connector": "+",
			"container": "div.cnn-search div.l-container div.cnn-search__results div.cnn-search__results-list div.cnn-search__result div.cnn-search__result-contents h3.cnn-search__result-headline a",
			"english": true,
			"name": "CNN",
			"url": "https://edition.cnn.com/search?q={title}",
			"using": true
		}
	]
};