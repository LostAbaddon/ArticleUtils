window.DefaultExtConfig = {
	AutoMath: true,
	AutoSearch: true,
	ResourceExpire: 1, // 单位：小时
	CacheRateLimit: 80, // 资源占用百分比
	CommonSource: [
		{
			url: "https://www.google.com/search?q={title}",
			using: true,
			connector: '+',
			container: '#search div.g div.r > a',
			title: 'h3'
		},
		{
			url: "https://www.baidu.com/s?ie=utf-8&wd={title}",
			using: true,
			connector: '%20',
			container: '#content_left div h3 > a:first-child'
		},
		{
			url: "https://www.bing.com/search?q={title}",
			using: true,
			connector: '+',
			container: '#b_results li h2 > a'
		},
	],
	BookSource: [
		{
			url: "https://epubw.com/?s={title}",
			using: true,
			connector: '+',
			container: 'section.container div.content div.row.equal article div.caption p:first-child a',
			redirect: 'epubw\\.com\\\/\\d+\\.html'
		},
		{
			url: "http://www.lingocn.com/?s={title}",
			using: true,
			connector: '+',
			container: 'div.post-list div.simplebar-mask div.simplebar-content article a.entry-title'
		},
	],
	VideoSource: [
		{
			url: "http://www.btbtdy.la/search/{title}.html",
			using: true,
			connector: '%20',
			container: 'div.list_so dl dd a'
		},
		{
			url: "https://91mjw.com/?s={title}",
			using: true,
			connector: '+',
			container: 'section.container div.content div.m-movies article > a',
			title: 'h2'
		},
	]
};