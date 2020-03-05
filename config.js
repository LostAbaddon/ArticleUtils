window.DefaultExtConfig = {
	"AutoMath": true,
	"AutoSearch": true,
	"ShowSearchNotify": true,
	"ResourceExpire": "24",
	"CacheRateLimit": "80",
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
		}
	],
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
	"BookSource": [
		{
			"name": "ePUBw",
			"url": "https://epubw.com/?s={title}",
			"connector": "+",
			"container": "section.container div.content div.row.equal article div.caption p:first-child a",
			"redirect": "epubw\\.com\\/\\d+\\.html",
			"using": false
		},
		{
			"name": "好资源",
			"url": "http://www.lingocn.com/?s={title}",
			"connector": "+",
			"container": "div.post-list div.simplebar-mask div.simplebar-content article a.entry-title",
			"using": true
		},
		{
			"name": "乐读电子书",
			"url": "http://www.txtbook.com.cn/search?keyword={title}",
			"connector": "+",
			"container": "table > tbody td.downCont > a[href^=\"/\"]",
			"using": true
		},
		{
			"name": "图灵社区",
			"url": "https://www.ituring.com.cn/search?q={title}",
			"connector": "+",
			"container": "div#search-result-books ul.block-items li.block-item h4.name a",
			"using": true
		},
		{
			"name": "ZLibrary",
			"url": "https://booksc.xyz/s/{title}",
			"connector": "%20",
			"container": "table tbody td h3 a",
			"form": "",
			"using": true
		},
		{
			"name": "书格",
			"url": "https://new.shuge.org/?s={title}",
			"connector": "+",
			"container": "article header h2 a",
			"using": true
		},
		{
			"name": "ePUBee",
			"url": "http://cn.epubee.com/books/?s={title}",
			"connector": "%20",
			"container": "div#get_ebook_list div.ebookitem div.list_title a",
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
		}
	]
};