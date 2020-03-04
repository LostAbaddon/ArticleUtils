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

const getLongestCommonPart = (stra, strb) => {
	var lena = stra.length, lenb = strb.length, target = '';

	if (lena < lenb) {
		for (let i = 0; i < lena; i ++) {
			for (let j = 1; j <= lena - i; j ++) {
				let str = stra.substr(i, j);
				if (strb.indexOf(str) < 0) break;
				if (target.length < j) target = str;
			}
			if (i + target.length > lena) break;
		}
	} else {
		for (let i = 0; i < lenb; i ++) {
			for (let j = 1; j <= lenb - i; j ++) {
				let str = strb.substr(i, j);
				if (stra.indexOf(str) < 0) break;
				if (target.length < j) target = str;
			}
			if (i + target.length > lenb) break;
		}
	}

	return target;
};

const startSearch = () => {
	if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) return;
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
	if (!!content) {
		content = content.map(title => title.substring(1, title.length - 1).trim());
		content = content.filter(title => !title.match(/^[前后]页[ \b]|[ \b][前后]页[ \b]|[ \b][前后]页$/));
	} else content = [];

	var title = document.title.trim(), titleLen = title.length;
	var headers = [...document.querySelectorAll('h1')];
	if (!!headers) {
		headers = headers.map(head => {
			var ttl = head.innerText.replace(/^[ \n\t\r]+|[ \n\t\r]+$/gi, '');
			return getLongestCommonPart(ttl, title);
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
	Object.keys(resource).forEach(type => {
		var res = resource[type];
		Object.keys(res).forEach(name => {
			var item = res[name];
			if (item.length === 0) {
				delete res[name];
				return;
			}
			item = item.map(kv => {
				var sim = getLongestCommonPart(kv[0], name);
				var last = sim;
				sim = sim.replace(/[a-z]+/gi, 'X');
				sim = sim.replace(/[0-9]+/gi, '0');
				sim = sim.replace(/[,\.\?\!\(\)\[\]\+\-\*\\\/，。！？、（）【】《》<>—…·`]/gi, '');
				sim = sim.replace(/ +/gi, '');
				kv.push(sim.length);
				return kv;
			});
			item.sort((la, lb) => lb[2] - la[2]);
			res[name] = item.map(kv => [kv[0], kv[1]]);
		});
	});
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