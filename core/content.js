const ResourceTypes = {
	'article': '文章',
	'book': '书籍',
	'pedia': '百科',
	'video': '影视',
	'news': '新闻',
	'common': '其它'
};
const Translators = {
	caiyun: '彩云小译',
	iciba: "金山词霸",
	bing: 'Bing 翻译',
	google: '谷歌翻译'
};

var showSearchNotify = false;
var hideWeakResults = false;
var otherFunctions = false; // 其它隐藏功能

window.getLongestCommonPart = (stra, strb) => {
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

const onInit = async config => {
	if (config.AutoMath) {
		await autoMath();
		await wait();
	}

	showSearchNotify = config.ShowSearchNotify;
	hideWeakResults = config.HideWeakResults;

	window.Archieve.init();

	if (showSearchNotify) initSearch();
	if (config.AutoSearch) {
		var pagepath = location.protocol + '//' + location.host + location.pathname;
		var ignoreList = config.IgnoreList || [];
		var shouldIgnore = ignoreList.some(item => {
			if (!item.using) return false;
			return pagepath.indexOf(item.url) >= 0;
		});
		if (shouldIgnore) return;

		var content = findResources();
		if (content.length === 0) return;

		chrome.runtime.sendMessage({
			event: 'FindResource',
			action: 'all',
			engine: null,
			force: false,
			auto: true,
			targets: content
		});
	}

	if (otherFunctions) {
		doubanFunctions();
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

	var cssFixer = document.querySelector('style[name="CSSFIXER"]');
	if (!cssFixer) {
		cssFixer = newEle('style');
		cssFixer.name = 'CSSFIXER';
		cssFixer.innerText = '.MathJax > nobr > span.math > span:empty {visibility: hidden !important;}';
		document.body.appendChild(cssFixer);
	}

	loadJS(chrome.extension.getURL('MathJax2.5/MathJax.js?config=TeX-AMS_HTML'), () => {
		res();
	});
});
const initSearch = () => {
	window.SearchInjection.init([{
		id: 'article',
		name: '文章'
	}, {
		id: 'book',
		name: '书籍'
	}, {
		id: 'pedia',
		name: '百科'
	}, {
		id: 'video',
		name: '影视'
	}, {
		id: 'news',
		name: '新闻'
	}, {
		id: 'common',
		name: '其它'
	}]);
	if (showSearchNotify) TextNotifier.init();
};

const getWilsonHot = (foed, foer, total = 0, common = 0) => {
	var q = 1 + 2 / foed;
	var p = foer / foed;
	var wilson = (q - 1 + 2 * p - Math.sqrt(Math.max(0, (q - 1 + 2 * p) ** 2 - 4 * q * (p ** 2)))) / (2 * q);
	if (foed < 100) wilson *= (foed / 100) ** ((100 - foed) / 5);
	wilson *= (foed + foer) / (500 + foed + foer);

	if (total > 0) {
		let rate = total / common;
		rate = Math.log(rate);
		rate = Math.sqrt(rate) * 0.9;
		rate = Math.exp(-rate);
		wilson *= 1 + rate;
	}

	wilson = Math.round(wilson * 100);
	return wilson;
};

const doubanFunctions = () => {
	if (location.hostname !== 'www.douban.com') return;
	doubanChangeNavBarStyle();
	if (location.pathname === '/contacts/rlist') doubanContractListPageFunction();
	else if (!!location.pathname.match(/\/people\/.+\//)) doubanUserPageFunction();
};
const doubanChangeNavBarStyle = () => {
	var dbnbCSSOpt = document.querySelector('style[name="DOUBANNAVBAROPT"]');
	if (!dbnbCSSOpt) {
		dbnbCSSOpt = newEle('style');
		dbnbCSSOpt.name = 'DOUBANNAVBAROPT';
		dbnbCSSOpt.innerText = '#db-global-nav.global-nav{position:fixed;width:100%;z-index:9999;}\n#db-nav-sns.nav{padding-top:20px;margin-bottom:30px;}\n';
		document.body.appendChild(dbnbCSSOpt);
	}
};
const doubanContractListPageFunction = () => {
	var list = document.querySelectorAll('div#content ul.user-list li div.info');
	[].forEach.call(list, (ele) => {
		var nums = ele.querySelectorAll('p b');
		var [foer, foed] = [].map.call(nums, n => (n.innerText * 1) || 0);
		var name = ele.querySelector('h3 a');

		var wilson = getWilsonHot(foed, foer, 0, 0);
		if (wilson >= 15) {
			name.innerHTML = '<span style="display:inline-block;min-width:150px;">' + name.innerHTML + '</span>　<span style="color:rgb(173,107,125);font-size:12px;font-weight:bolder;">（可关注度：' + wilson + '）</span>';
		}
		else {
			name.innerHTML = '<span style="display:inline-block;min-width:150px;">' + name.innerHTML + '</span>　<span style="color:rgb(175,175,175);font-size:12px;">（可关注度：' + wilson + '）</span>';
		}
	});
};
const doubanUserPageFunction = () => {
	var foed = document.querySelector('#friend h2 span.pl a');
	var foer = document.querySelector('p.rev-link a');
	foed = foed.innerText.match(/成员(\d+)/);
	if (!foed) return;
	foer = foer.innerText.match(/被(\d+)人关注/);
	if (!foer) return;

	foed = foed[1] * 1;
	if (isNaN(foed)) return;
	foer = foer[1] * 1;
	if (isNaN(foer)) return;

	var movies = document.querySelector('#movie h2 span.pl');
	var books = document.querySelector('#book h2 span.pl');

	if (!!movies) {
		movies = movies.innerText;
		movies = movies.match(/\d+部/g);
		if (!!movies) {
			movies = movies.reduce((val, ele) => {
				var a = ele.match(/\d+/);
				if (!a) return val;
				a = a * 1;
				if (isNaN(a)) return val;
				return val + a;
			}, 0);
		}
		else {
			movies = 0;
		}
	}
	else {
		movies = 0;
	}
	if (!!books) {
		books = books.innerText;
		books = books.match(/\d+本/g);
		if (!!books) {
			books = books.reduce((val, ele) => {
				var a = ele.match(/\d+/);
				if (!a) return val;
				a = a * 1;
				if (isNaN(a)) return val;
				return val + a;
			}, 0);
		}
		else {
			books = 0;
		}
	}
	else {
		books = 0;
	}

	var total = movies + books, common = 0;
	if (total > 0) {
		common = document.querySelector('#common h2');
		if (!!common) {
			common = common.innerText;
			common = common.match(/\((\d+)\)/);
			if (!!common) {
				common = common[1] * 1;
				if (isNaN(common)) common = 0;
			}
			else {
				common = 0;
			}
		}
		else {
			common = 0;
		}
	}
	var wilson = getWilsonHot(foed, foer, 0, 0);

	var name = document.querySelector('#content .article .info h1');
	var tag = newEle('span');
	tag.innerText = '　（可关注度：' + wilson + '）　';
	tag.style.fontSize = '12px';
	if (wilson >= 15) {
		tag.style.color = 'rgb(173,107,125)';
		tag.style.fontWeight = 'bolder';
	}
	else {
		tag.style.color = 'rgb(175,175,175)';
	}
	name.insertBefore(tag, name.firstElementChild);
};

const getSelectedText = () => {
	var selection = document.getSelection();
	var text = selection.toString();
	return text.replace(/^[ \n\t\r]+|[ \n\t\r]+$/gi, '');

	if (text.length === 0) {
		let sel = selection.getRangeAt(0);
		sel = sel.startContainer;
		let tag = sel.tagName;
		if (!!tag) {
			tag = tag.toLowerCase();
			if (tag === 'input' || tag === 'textarea') {
				text = sel.value;
			} else {
				let ele = sel.querySelector('input');
				if (!ele) ele = sel.querySelector('textarea');
				if (!!ele) {
					text = ele.value;
				}
			}
		}
	} else {
		text = text.replace(/^[ \n\t\r]+|[ \n\t\r]+$/gi, '');
	}

	return text;
};
const searchItem = (type, id) => {
	if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) return;
	initSearch();

	var text = getSelectedText(), force;
	if (text.length === 0) {
		text = findResources();
		force = false;
	} else {
		text = [text];
		force = isNumber(id);
	}

	if (showSearchNotify) {
		if (type === 'article') TextNotifier.notify('开始寻找文章资源');
		else if (type === 'book') TextNotifier.notify('开始寻找书籍资源');
		else if (type === 'pedia') TextNotifier.notify('开始寻找百科资源');
		else if (type === 'video') TextNotifier.notify('开始寻找影视资源');
		else if (type === 'news') TextNotifier.notify('开始寻找新闻资源');
		else if (type === 'common') TextNotifier.notify('开始寻找综合资源');
		else if (force) TextNotifier.notify('开始寻找指定资源');
		else TextNotifier.notify('开始寻找页面资源');
	}

	chrome.runtime.sendMessage({
		event: 'FindResource',
		action: type,
		engine: id,
		force,
		auto: false,
		targets: text
	});
};
const findResources = () => {
	var content = document.body.innerText.match(/《[^\n]+?》/gi);
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

	return content;
};
const onGetResource = (resource, name, type) => {
	if (showSearchNotify) TextNotifier.notify('找到资源：' + name + '（'  + (ResourceTypes[type] || '其它') + '）');
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
			if (hideWeakResults) {
				let limit = Math.ceil(name.length / 5);
				item = item.filter(line => line[2] > limit);
			}
			res[name] = item.map(kv => [kv[0], kv[1]]);
		});
	});
	window.SearchInjection.show(resource);
};

var translationPad = null;
const toggleTranslation = () => {
	var text = getSelectedText();
	if (!text) return;
	text = text.replace(/^[ \t\r\n]+|[ \t\r\n]+$/gi, '');
	if (!text) return;

	if (showSearchNotify) {
		TextNotifier.notify('开始翻译：' + text);
	}
	chrome.runtime.sendMessage({
		event: 'ToggleTranslation',
		target: text
	});
};
const gotTranslation = async list => {
	var rect = document.getSelection();
	if (!rect) return;
	rect = rect.getRangeAt(0);
	if (!rect) return;
	rect = rect.getBoundingClientRect();
	if (!rect) return;

	if (!translationPad) {
		translationPad = newEle('div', 'extension_translation_pad');
		translationPad.style.position = 'absolute';
		translationPad.style.display = 'block';
		translationPad.style.boxSizing = 'border-box';
		translationPad.style.padding = '20px';
		translationPad.style.margin = '0px';
		translationPad.style.borderRadius = '15px';
		translationPad.style.boxShadow = '2px 2px 5px rgba(53, 53, 53, 0.6)';
		translationPad.style.backgroundColor = 'white';
		translationPad.style.width = '300px';
		translationPad.style.opacity = '0';
		translationPad.style.transition = 'opacity 300ms ease-in-out';
		translationPad.style.zIndex = '9100';

		translationPad.BG = newEle('div', 'extension_translation_background');
		translationPad.BG.style.position = 'fixed';
		translationPad.BG.style.display = 'block';
		translationPad.BG.style.padding = '0px';
		translationPad.BG.style.margin = '0px';
		translationPad.BG.style.top = '0px';
		translationPad.BG.style.bottom = '0px';
		translationPad.BG.style.left = '0px';
		translationPad.BG.style.right = '0px';
		translationPad.BG.style.zIndex = '9000';

		translationPad.BG.addEventListener('click', async () => {
			translationPad.style.opacity = '0';
			await wait(300);
			document.body.removeChild(translationPad);
			document.body.removeChild(translationPad.BG);
		});
	}
	var content = '';
	var length = 0, used = 0;
	Object.keys(Translators).forEach((vendor, index) => {
		var trans = list[vendor];
		if (!trans) return;
		used ++;
		length += trans.replace(/[a-z]+ */gi, 'XXXXX').length;
		content = content + '<div style="font-weight:bolder;font-size:17px;color:black;' + (index > 0 ? 'margin-top:10px;' : '') + '">' + Translators[vendor] + '</div>';
		content = content + '<div style="font-size:14px;color:black;">' + trans.replace(/\n/gi, '<br>') + '</div>';
	});
	if (used === 0) {
		if (showSearchNotify) {
			TextNotifier.notify('没找到合适的翻译……');
		}
		return;
	}
	length /= used;
	var width = 0;
	if (length > 60) {
		width = 500;
	} else {
		width = 300;
	}
	translationPad.style.width = width + 'px';
	translationPad.innerHTML = content;
	var top = window.scrollY + rect.top + rect.height + 5;
	translationPad.style.top = top + 'px';
	var left = rect.left;
	if (left >= window.innerWidth / 3 * 2) left = rect.right - width;
	translationPad.style.left = left + 'px';
	document.body.appendChild(translationPad.BG);
	document.body.appendChild(translationPad);
	await wait(100);
	translationPad.style.opacity = '1';
};

const toggleArchieve = () => {
	Archieve.launch();
};

const launchGreatBonus = () => {
	var [list, depth] = bonusAllNodes(document.body);
	list.splice(0, 1);
	list.forEach(async ele => {
		var d = ele[1];
		ele = ele[0];
		if (ele !== document.body) ele.style.pointerEvents = 'none';
		var delay = Math.round(600 + 800 * Math.random())
		ele.style.transition = 'opacity ' + delay + 'ms ease-in-out';
		var rate = 0.8 + 0.4 * Math.random();
		await wait((depth - d) * rate * 300);
		ele.style.opacity = '0';
		if (ele !== document.body) return;
		await wait(delay);
		if (ele === document.body) ele.style.cursor = 'none';
	});
};
const bonusAllNodes = (root, level=0, nodes) => {
	if (!nodes || nodes.length === 0) {
		nodes = new Map();
		nodes.set('depth', level);
		nodes.set(root, level);
	}
	if (isNumber(level)) level++;
	else level = 1;
	root.childNodes.forEach(node => {
		var tag = node.tagName;
		if (!tag) return;
		tag = tag.toLowerCase();
		if (['link', 'ref', 'meta', 'script', 'noscript'].includes(tag)) return;
		if (nodes.has(node)) return;
		nodes.set(node, level);
		if (nodes.get('depth') < level) nodes.set('depth', level)
		bonusAllNodes(node, level, nodes);
	});
	return [[...nodes], nodes.get('depth')];
};

ExtConfigManager(DefaultExtConfig, (event, key, value) => {
	if (event === 'init') onInit(key);
	else if (event === 'update') {
		if (key === 'ShowSearchNotify') {
			showSearchNotify = value;
			if (showSearchNotify) TextNotifier.init();
		} else if (key === 'HideWeakResults') {
			hideWeakResults = value;
		}
	}
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
RegiestKeySeq('ctrl+ctrl+s', 'SearchResource', () => {
	searchItem('all', null);
});
RegiestKeySeq('ctrl+ctrl+t', 'ToggleTranslation', () => {
	toggleTranslation();
});
RegiestKeySeq('ctrl+ctrl+a', 'ToggleArchieve', () => {
	toggleArchieve();
});
RegiestKeySeq('ctrl+ctrl+a+a', 'ViewArchieve', () => {
	chrome.runtime.sendMessage({ event: 'ViewArchieve' });
});
RegiestKeySeq('ctrl+ctrl+e', 'ToggleArchieve', () => {
	chrome.tabs.create({ url: chrome.runtime.getURL('/markup/editor.html'), active: true });
});
RegiestKeySeq('up+up+down+down+left+left+right+right+b+a+b+a', 'GreatBonus', launchGreatBonus);

chrome.runtime.onMessage.addListener(msg => {
	if (msg.event === 'GotResource') onGetResource(msg.resource, msg.targetName, msg.targetType);
	else if (msg.event === 'ToggleSearch') {
		let action = msg.action || 'All';
		let id = msg.id;

		if (action === 'All') searchItem('all', null);
		else if (action === 'Article') searchItem('article', id);
		else if (action === 'Book') searchItem('book', id);
		else if (action === 'Pedia') searchItem('pedia', id);
		else if (action === 'Video') searchItem('video', id);
		else if (action === 'News') searchItem('news', id);
		else if (action === 'Common') searchItem('common', id);
	}
	else if (msg.event === 'ToggleTranslation') toggleTranslation();
	else if (msg.event === 'GotTranslation') gotTranslation(msg.action);
	else if (msg.event === 'ToggleArchieve') toggleArchieve();
	else if (msg.event === 'ArticleArchieved') {
		TextNotifier.init();
		if (msg.status === 1) {
			TextNotifier.notify('<span style="color:blue;">内容（' + msg.fingerprint + '）已存档</span>');
		} else if (msg.status === 2) {
			TextNotifier.notify('<span style="color:green;">内容（' + msg.fingerprint + '）已更新</span>');
		} else {
			TextNotifier.notify('<span style="color:red;">内容（' + msg.fingerprint + '）已存在</span>');
		}
	}
});