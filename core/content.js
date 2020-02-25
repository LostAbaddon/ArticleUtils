const ResourceTypes = {
	'book': '书籍',
	'video': '影视',
	'common': '其它'
};

var showSearchNotify = false;

const onInit = async config => {
	if (config.AutoMath) {
		await autoMath();
		await wait();
	}

	if (config.AutoSearch) {
		showSearchNotify = config.ShowSearchNotify;
		initSearch();
		findResources();
	}
};
const autoMath = () => new Promise(res => {
	var hasMathJax = [].some.call(document.querySelectorAll('script'), script => {
		return script.src.toLowerCase().indexOf('mathjax') >= 0;
	});
	if (hasMathJax) return res();

	var content = document.body.innerText.split(/\n{2,}/);
	hasMathJax = content.some(line => {
		if (!!line.match(/\$[^\n\$]+?\$/)) return true;
		if (!!line.match(/\$\$\n[^\$]+?\n\$\$/)) return true;
	});
	if (!hasMathJax) return res();

	var config = newEle('script');
	config.type = 'text/x-mathjax-config';
	config.innerHTML = `MathJax.Hub.Config({
		extensions: ["tex2jax.js"],
		TeX: {
			extensions: ["AMSmath.js", "AMSsymbols.js"]
		},
		jax: ["input/TeX", "output/HTML-CSS"],
		tex2jax: {
			inlineMath: [["$","$"]]}
		});`;
	document.body.appendChild(config);

	loadJS(chrome.extension.getURL('MathJax2.5/MathJax.js?config=TeX-AMS_HTML'), () => {
		res();
	});
});
const initSearch = () => {
	window.SearchInjection.init([{
		id: 'book',
		name: '书籍'
	}, {
		id: 'video',
		name: '影视'
	}, {
		id: 'common',
		name: '其它'
	}]);
	if (showSearchNotify) TextNotifier.init();
};

const startSearch = () => {
	initSearch();
	var selection = document.getSelection().toString();
	selection = selection.replace(/^[ \n\t\r]+|[ \n\t\r]+$/gi, '');
	if (selection.length === 0) {
		TextNotifier.notify('开始寻找页面资源');
		findResources();
	} else {
		TextNotifier.notify('开始寻找指定资源');
		chrome.runtime.sendMessage({
			event: 'FindResource',
			targets: [selection]
		});
	}
};
const findResources = () => {
	var content = document.body.innerText.match(/<[^\n]+?>|《[^\n]+?》/gi);
	if (!!content) content = content.map(title => title.substring(1, title.length - 1).trim());
	else content = [];

	var title = document.title.trim(), titleLen = title.length;
	var headers = [...document.querySelectorAll('h1')];
	if (!!headers) {
		headers = headers.map(head => {
			var ttl = head.innerText.replace(/^[ \n\t\r]+|[ \n\t\r]+$/gi, '');
			var len = ttl.length, target = '';
			if (len < titleLen) {
				for (let i = 0; i < len; i ++) {
					for (let j = 1; j <= len - i; j ++) {
						let str = ttl.substr(i, j);
						if (title.indexOf(str) < 0) break;
						if (target.length < str.length) target = str;
					}
					if (i + target.length > titleLen) break;
				}
			} else {
				for (let i = 0; i < titleLen; i ++) {
					for (let j = 1; j <= titleLen - i; j ++) {
						let str = title.substr(i, j);
						if (ttl.indexOf(str) < 0) break;
						if (target.length < str.length) target = str;
					}
					if (i + target.length > len) break;
				}
			}

			return target;
		}).filter(t => !!t && t.length / (titleLen + 1) > 0.5);
		headers = [...content, ...headers];
	} else {
		headers = content;
	}
	content = [];
	headers.forEach(title => {
		if (content.includes(title)) return;
		content.push(title);
	});

	chrome.runtime.sendMessage({
		event: 'FindResource',
		targets: content
	});
};
const onGetResource = (resource, name, type) => {
	TextNotifier.notify('找到资源：' + name + '（'  + ResourceTypes[type] + '）');
	window.SearchInjection.show(resource);
};

ExtConfigManager(DefaultExtConfig, (event, key, value) => {
	if (event === 'init') onInit(key);
});

RegiestKeySeq('ctrl+ctrl+m', 'ConvertMath', async () => {
	var last = ExtConfigManager.get('AutoMath');
	await ExtConfigManager.set('AutoMath', !last);
	if (last) {
		window.location.reload();
	} else {
		autoMath();
	}
});
RegiestKeySeq('ctrl+ctrl+s', 'SearchResource', startSearch);

chrome.runtime.onMessage.addListener(msg => {
	if (msg.event === 'GotResource') onGetResource(msg.resource, msg.targetName, msg.targetType);
	else if (msg.event === 'ToggleSearch') startSearch();
});