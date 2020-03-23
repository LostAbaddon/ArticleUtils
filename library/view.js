const query = {};

(() => {
	var search = location.search;
	search = search.substring(1, search.length);
	search = search.split('&').map(k => k.trim()).filter(k => k.length > 0);
	search.forEach(item => {
		item = item.split('=');
		var key = item.splice(0, 1)[0];
		var value = item.join('=');
		query[key] = value;
	});

	MathJax.Hub.Config({
		extensions: ["tex2jax.js"],
		TeX: {
			extensions: ["AMSmath.js", "AMSsymbols.js"]
		},
		jax: ["input/TeX", "output/HTML-CSS"],
		tex2jax: {
			inlineMath: [["$","$"]]}
		}
	);
}) ();

const Responsers = {};

const num2time = num => {
	var time = new Date(num);
	var Y = (time.getYear() + 1900) + '';
	var M = (time.getMonth() + 1) + '';
	var D = time.getDate() + '';
	var h = time.getHours() + '';
	var m = time.getMinutes() + '';
	var s = time.getSeconds() + '';

	if (M.length < 2) M = '0' + M;
	if (D.length < 2) D = '0' + D;
	if (h.length < 1) h = '00';
	else if (h.length < 2) h = '0' + h;
	if (m.length < 1) m = '00';
	else if (m.length < 2) m = '0' + m;
	if (s.length < 1) s = '00';
	else if (s.length < 2) s = '0' + s;
	return Y + '/' + M + '/' + D + ' ' + h + ':' + m + ':' + s;
};

Responsers.GetArticleByID = data => {
	ArticleTitle.querySelector('p.title').innerText = data.title;
	var info = [];
	if (!!data.author && data.author.length > 0) {
		if (!!data.email && data.email.length > 0) {
			info.push('作者：<a class="author-email" href="mailto:' + data.email + '">' + data.author + '</a>');
		}
		else {
			info.push('作者：' + data.author);
		}
	}
	if (!!data.update && data.update > 0) {
		info.push('更新于：' + num2time(data.update));
	}
	var wordCount = data.content.replace(/[ 　\t\n\+\-\*_\.,\?!\^\[\]\(\)\{\}$#@%&=\|\\\/<>~，。《》？‘’“”；：:、【】{}（）—…￥·`]+/g, ' ').replace(/ {2,}/g, ' ');
	wordCount = wordCount.replace(/[a-z0-9]+/gi, 'X').replace(/ +/g, '');
	wordCount = wordCount.length;
	info.push('字数：' + wordCount);
	info = info.join('<span class="blank"></span>')
	ArticleTitle.querySelector('p.author').innerHTML = info;

	if (!!data.fingerprint && data.fingerprint.length > 0) {
		ArticleTitle.querySelector('p.fingerprint').innerHTML = '内容指纹：' + data.fingerprint;
	}
	else {
		ArticleTitle.querySelector('p.fingerprint').style.display = 'none';
	}

	ArticleContent.innerHTML = MarkUp.parse(data.content, {
		showtitle: false,
		resources: true,
		glossary: true,
		toc: true
	});

	if (!!data.category) data.category.forEach(kw => {
		var ui = newEle('a', 'keyword cate-link');
		ui.innerText = kw;
		ui.href = './index.html?path=' + kw;
		ArticleKeywords.appendChild(ui);
	});
};

GoBacker.addEventListener('click', () => {
	location.href = './index.html';
});
Editor.addEventListener('click', () => {
	location.href = '../markup/editor.html?id=' + query.id;
});

chrome.runtime.onMessage.addListener(msg => {
	var cb = Responsers[msg.event];
	if (!!cb) cb(msg.data);
});

chrome.runtime.sendMessage({ event: 'GetArticleByID', id: query.id });

InitNotes(ArticleContent);