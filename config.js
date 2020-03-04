window.DefaultExtConfig = {
	AutoMath: true,
	AutoSearch: true,
	ShowSearchNotify: true,
	ResourceExpire: 12, // 单位：小时
	CacheRateLimit: 80, // 资源占用百分比
	CommonSource: [
		{
			name: '谷歌',
			url: "https://www.google.com/search?q={title}",
			using: true,
			connector: '+',
			container: '#search div.g div.r > a',
			title: 'h3'
		},
		{
			name: '百度',
			url: "https://www.baidu.com/s?ie=utf-8&wd={title}",
			using: true,
			connector: '%20',
			container: '#content_left div h3 > a:first-child'
		},
		{
			name: '必应',
			url: "https://www.bing.com/search?q={title}",
			using: true,
			connector: '+',
			container: '#b_results li h2 > a'
		},
	],
	BookSource: [
		{
			name: 'ePUBw',
			url: "https://epubw.com/?s={title}",
			using: true,
			connector: '+',
			container: 'section.container div.content div.row.equal article div.caption p:first-child a',
			redirect: 'epubw\\.com\\\/\\d+\\.html'
		},
		{
			name: '好资源',
			url: "http://www.lingocn.com/?s={title}",
			using: true,
			connector: '+',
			container: 'div.post-list div.simplebar-mask div.simplebar-content article a.entry-title'
		},
	],
	VideoSource: [
		{
			name: 'BT电影',
			url: "http://www.btbtdy.la/search/{title}.html",
			using: true,
			connector: '%20',
			container: 'div.list_so dl dd a'
		},
		{
			name: '91美剧网',
			url: "https://91mjw.com/?s={title}",
			using: true,
			connector: '+',
			container: 'section.container div.content div.m-movies article > a',
			title: 'h2'
		},
		{
			name: '高清电影',
			url: "https://gaoqing.la/?s={title}",
			using: true,
			connector: '+',
			container: 'div.container ul li.post div.article h2 a'
		},
	]
};