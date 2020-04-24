const UnavailableChars = /\\\//gi;
const ForbiddenNames = [ 'cache', '快照', '广告', 'here', 'next', 'prev', 'see all', 'see more' ];
const ForbiddenPaths = [ 'cache', 'translate', 'translator', 'ad.', 'javascript:' ];
const SearchItem = ['common', 'book', 'video', 'article', 'pedia', 'news'];
const ChineseChars = /[\u4e00-\u9fa5]/gi;
const JapaneseChars = /[\u0800-\u4e00]/gi;
const DualChars = /[^\x00-\xff]/gi;
const ExtHost = chrome.extension.getURL('');

const onInit = config => {
	chrome.runtime.onMessage.addListener((msg, sender, response) => {
		if (msg.event === 'FindResource') {
			var engineList = {};
			if (msg.auto) {
				let protocol = sender.url.split('://')[0];
				if (!protocol) return;
				let url = sender.url.split('?')[0];
				url = url.replace(protocol + '://', '');
				url = url.split('/');
				if (url.length > 2) url.splice(2, url.length - 2);
				url = url.join('/');

				let cfg = config.SilenceRules;
				let rules = cfg[url];
				if (!rules) {
					rules = {};
					Object.keys(config.DefaultSearchEngine).forEach(key => rules[key] = config.DefaultSearchEngine[key]);
				} else {
					Object.keys(config.DefaultSearchEngine).forEach(key => {
						if (rules[key] === undefined) rules[key] = config.DefaultSearchEngine[key]
					});
				}
				SearchItem.forEach(name => {
					if (!rules[name]) return;
					name = name.substring(0, 1).toUpperCase() + name.substring(1, name.length).toLowerCase() + 'Source';
					engineList[name] = config[name];
				});
			} else {
				SearchItem.forEach(name => {
					name = name.substring(0, 1).toUpperCase() + name.substring(1, name.length).toLowerCase() + 'Source';
					engineList[name] = config[name];
				});
			}

			searchResources(msg.targets, msg.action, msg.engine, msg.force, engineList, sender.tab.id);
		}

		else if (msg.event === 'ToggleTranslation') launchTranslation(msg.target, sender.tab.id);

		else if (msg.event === 'ArchieveArticle') archieveArticle(msg.fingerprint, msg.title, msg.content, msg.url, sender.tab.id);
		else if (msg.event === 'ViewArchieve') viewArchieve();
		else if (msg.event === 'DeleteArchieve') unarchieveArticle(msg.fingerprint, sender.tab.id);
		else if (msg.event === 'ModifyArchieveTitle') modifyArchieveTitle(msg.fingerprint, msg.title, sender.tab.id);
		else if (msg.event === 'ModifyArchieve') modifyArchieve(msg.fingerprint, msg.content, sender.tab.id);

		else if (msg.event === 'GetArticleList') getArticleList(sender.tab.id);
		else if (msg.event === 'SaveArticle') saveArticle(msg.article, msg.originID, sender.tab.id);
		else if (msg.event === 'GetArticleByID') getArticleByID(msg.id, sender.tab.id);
		else if (msg.event === 'GetArticleCategories') getArticleCategories(sender.tab.id);
		else if (msg.event === 'AddCategories') addCategories(msg.name, sender.tab.id);
		else if (msg.event === 'ModifyArticleCategories') modifyArticleCategories(msg.category, sender.tab.id);
		else if (msg.event === 'DeleteArticleCategories') deleteArticleCategories(msg.target, sender.tab.id);

		else if (msg.event === 'GetBackendServer') getBackendServer(sender.tab.id);

		else if (msg.event === 'PublishArticle') publishArticle(msg.id, sender.tab.id);
	});

	window.cacheStorage = new CacheStorage('ResourceCache', 1);
	window.cacheStorage.init(config.ResourceExpire * 1, config.ResourceGCInterval * 1, config.ResourceCacheLimit * 1,
		db => new Promise(async res => {
			var now = Date.now(), first = Infinity, last = 0;
			var list = await store.get('ResourceCacheMenu');
			if (!!list) {
				let totalSize = 0;
				let actions = list.map(item => new Promise(async res => {
					var content = await store.get(item.name);
					if (!isNumber(content.length) || content.length === 0) {
						res();
						return;
					}
					var size = JSON.stringify(content).length;
					totalSize += size;
					var url = item.name.replace('Resource::', '');
					var tasks = [];
					tasks.push(db.set('menu', url, {
						stamp: item.stamp,
						usage: item.usage,
						size: size
					}));
					time = now - item.stamp;
					if (time > last) last = time;
					if (time < first) first = time;
					tasks.push(db.set('cache', url, content));
					await Promise.all(tasks);
					res();
				}));
				await Promise.all(actions);
				await db.set('status', 'TotalSize', totalSize);
				console.info("已将老版缓存数据迁移到 IndexedDB");
			}
		})
	);

	window.transCache = new CacheStorage('TranslationCache', 1);
	window.transCache.init(24 * 30, 24, 300); // 30 天过期，24 小时清理一次，总容量 300 MB

	window.archieveCache = new CacheStorage('ArchieveCache', 1);
	window.archieveCache.init(24 * 365, 24, 500); // 1 年过期，24 小时清理一次，总容量 500 MB

	window.libraryStorage = new LibraryStorage();
	window.libraryStorage.init();
};
const onUpdate = (key, value) => {
	if (key === 'ResourceExpire') window.cacheStorage.changeExpire(value);
	else if (key === 'ResourceGCInterval') window.cacheStorage.changeGCInterval(value);
	else if (key === 'ResourceCacheLimit') window.cacheStorage.changeCacheLimit(value);
};
const analyzePage = page => {
	var low = page.toLowerCase();
	var pos = low.indexOf('<body');
	if (pos < 0) return '';
	page = page.substring(pos, page.length);
	low = low.substring(pos, low.length);
	pos = low.indexOf('>');
	if (pos < 0) return '';
	page = page.substring(pos + 1, page.length);
	low = low.substring(pos + 1, low.length);
	pos = low.indexOf('</body>');
	if (pos < 0) return '';
	page = page.substring(0, pos);
	page = page.replace(/<img.*?\/?>/gi, '');
	page = page.replace(/<script.*?>[\w\W]*?<\/script>/gi, '');
	page = page.replace(/<style.*?>[\w\W]*?<\/style>/gi, '');
	page = page.replace(/^[ \n\t\r]+|[ \n\t\r]+$/g, '');
	if (page.length === 0) return '';
	return page;
};

const searchResources = (targets, type, engine, force, config, tabID) => {
	var result = {}, task = targets.length;
	if (task === 0) return;
	targets.forEach(async (t) => {
		searchResource(t, type, engine, force, config, (list, target, name) => {
			if (!list) return;
			result[t] = list;
			analyzeResource(tabID, result, target, name);
		});
	});
};
const searchResource = (target, type, engine, force, config, callback) => {
	if (!!target.match(UnavailableChars)) return callback();

	var result = {};
	var done = name => list => {
		if (!!list && Object.keys(list).length > 0) {
			result[name] = list;
			callback(result, target, name);
		}
	};

	SearchItem.forEach(name => {
		if (type !== 'all' && name !== type) return;
		var engines = name.substr(0, 1).toUpperCase() + name.substr(1, name.length).toLowerCase();
		engines = config[engines + 'Source'];
		if (!engines) return;
		if (isNumber(engine)) engines = [engines[engine]];
		search(target, engines, force, done(name));
	});
};
const search = (target, engines, force, callback) => {
	console.info('开始搜索资源：' + target);

	var result = {};
	var done = (list) => {
		if (!!list && list.length > 0) {
			list.forEach(item => result[item[1]] = item[0]);
			callback(result);
		}
	};

	var isEng = target.match(/[a-z0-9]/gi);
	if (!isEng) isEng = false;
	else {
		isEng = isEng.join('');
		isEng = isEng.length / target.replace(/[ \n\t\r]/gi, '').length;
		if (isEng > 0.5) isEng = true;
		else isEng = false;
	}

	engines.forEach(async cfg => {
		if (!force) {
			if (!cfg.using) return done();
			if (isEng) {
				if (cfg.english === false) return done();
			} else {
				if (cfg.chinese === false) return done();
			}
		}
		if (!cfg.host) {
			cfg.host = cfg.url.split('/');
			cfg.host.splice(3, cfg.host.length);
			cfg.host = cfg.host.join('/') + '/';
		}

		var query = target.replace(/ +/g, cfg.connector || '+');
		var url = cfg.url.replace(/\{title\}/g, query), page, resp;

		if (force) {
			chrome.tabs.create({ url, active: true });
			return done();
		}

		var saveTag = url;
		if (!!cfg.form && isString(cfg.form) && cfg.form.length > 0) {
			saveTag = url + "||" + cfg.form + "=" + query;
		}

		var list = await window.cacheStorage.get(saveTag);
		if (!list) {
			try {
				if (!!cfg.form && isString(cfg.form) && cfg.form.length > 0) {
					let data = cfg.form + '=' + query;
					[page, resp] = await xhr(url, 'post', data);
				} else {
					[page, resp] = await xhr(url);
				}
			} catch {
				return done();
			}

			if (!!cfg.redirect && cfg.redirect.length > 0) {
				let reg = new RegExp(cfg.redirect);
				if (resp.match(reg)) list = [[target, resp]];
			}
			if (!list) list = await analyzeSearch(page, cfg);

			await window.cacheStorage.set(saveTag, list);
			var [totalSize, usage] = await cacheStorage.getUsage();
			console.info('更新资源搜索记录缓存，缓存池已用 ' + totalSize + ' bytes (' + (Math.round(usage * 10000) / 100) + '%)');
		}

		done(list);
	});
};
const analyzeSearch = (page, cfg) => new Promise(async res => {
	page = analyzePage(page);
	if (!page || page.length === 0) return res([]);

	var container = newEle('div', null, 'MainContainer');
	container.innerHTML = page;
	await wait();

	container = container.querySelectorAll(cfg.container || 'a');
	if (!container || container.length === 0) return res([]);

	var list = [];
	container.forEach(link => {
		var name, url;
		if (!!cfg.title && cfg.title.length > 0) {
			name = link.querySelector(cfg.title);
			if (!name) name = link;
			name = name.innerText;
		}
		else name = link.innerText;
		name = name.replace(/^[ \n\t\r]+|[ \n\t\r]+$/g, '');
		url = link.href;

		if (name.length === 0 || url.length === 0) return;

		var test = name.toLowerCase();
		var forbid = ForbiddenNames.some(f => test.indexOf(f) >= 0);
		if (forbid) return;
		test = url.toLowerCase();
		forbid = ForbiddenPaths.some(f => test.indexOf(f) >= 0);
		if (forbid) return;
		url = url.replace(ExtHost, cfg.host);
		url = url.replace('chrome-extension://', 'https://')

		list.push([name, url]);
	});

	res(list);
});
const regulizeResource = (result, items, targets) => {
	result.book = result.book || {};
	result.video = result.video || {};
	result.article = result.article || {};
	result.pedia = result.pedia || {};

	Object.keys(targets).forEach(link => {
		var title = targets[link];
		var has = items.some(item => !!result[item][link]);
		if (has) {
			delete targets[link];
			return;
		}

		var low = link.toLowerCase();
		if (low.indexOf('book') >= 0) {
			result.book[link] = title;
			delete targets[link];
			return;
		} else if (low.indexOf('video') >= 0
			|| !!low.match(/^v\.|\bv\./)) {
			result.video[link] = title;
			delete targets[link];
			return;
		}

		low = title.toLowerCase();
		if (low.indexOf('电子书') >= 0
			|| low.indexOf('阅读') >= 0
			|| !!low.match(/pdf|mobi|epub|txt/i)) {
			result.book[link] = title;
			delete targets[link];
		} else if (low.indexOf('电影') >= 0
			|| low.indexOf('视频') >= 0
			|| low.indexOf('磁力') >= 0
			|| low.indexOf('高清') >= 0
			|| low.indexOf('超清') >= 0
			|| low.indexOf('双语') >= 0
			|| low.indexOf('双字') >= 0
			|| low.indexOf('蓝光') >= 0
			|| low.indexOf('免费观看') >= 0
			|| !!low.match(/BT *下载/i)
			|| (!!low.match(/^movie\.|\bmovie\./i) && !low.match(/^movie\.douban\.|\bmovie\.douban\./i))) {
			result.video[link] = title;
			delete targets[link];
		} else if (low.indexOf('学术') >= 0
			|| low.indexOf('阅读') >= 0
			|| low.indexOf('文库') >= 0) {
			result.article[link] = title;
			delete targets[link];
		} else if (low.indexOf('百科') >= 0
			|| low.indexOf('知道') >= 0) {
			result.pedia[link] = title;
			delete targets[link];
		}
	});
};
const analyzeResource = (tabID, resources, targetName, targetType) => {
	var result = {};
	Object.keys(resources).forEach(name => {
		var list = resources[name];
		list.book = list.book || {};
		list.video = list.video || {};

		var items = Object.keys(list).filter(n => n !== 'news');
		var commons = list.news;
		if (!!commons) regulizeResource(list, items, commons);
		items = Object.keys(list).filter(n => n !== 'common');
		commons = list.common;
		if (!!commons) regulizeResource(list, items, commons);
	});

	Object.keys(resources).forEach(name => {
		var list = resources[name];
		Object.keys(list).forEach(type => {
			if (!result[type]) result[type] = {};
			var map = result[type];
			map[name] = [];
			Object.keys(list[type]).forEach(link => {
				var title = list[type][link];
				map[name].push([title, link]);
			});
		});
	});

	sendBackResource(tabID, result, targetName, targetType);
};
const sendBackResource = (tabID, resource, targetName, targetType) => {
	chrome.tabs.sendMessage(tabID, {
		event: 'GotResource',
		resource,
		targetName,
		targetType
	});
};

const launchTranslation = async (word, tabID) => {
	word = word.replace(/[ ]+/gi, ' ');
	if (!word) return;

	var zhs = (word.match(ChineseChars) || []).length;
	var left = word.replace(/[,\.\+\-\(\)\[\]\{\}。，\?\!？！（）【】#]/gi, '').replace(/[a-z0-9]+ */gi, 'X');
	var toCh = left.length >= zhs * 1.5;
	var results = {}, actions = [];

	var isSentence = !!word.match(/[,\.\+\-\(\)\[\]\{\}。，\?\!？！（）【】#~'"‘’“”、]/gi);
	var items = word.replace(/[a-z0-9]+ */gi, '哈喽');
	items = (items.match(ChineseChars) || []).length + (items.match(JapaneseChars) || []).length;
	isSentence = isSentence || items > 20;

	actions.push(bingTranslation(word, toCh, !isSentence, results, tabID));
	actions.push(caiyunTranslation(word, toCh, !isSentence, results, tabID));
	actions.push(icibaTranslation(word, toCh, !isSentence, results, tabID));
	await Promise.all(actions);

	Object.keys(results).forEach(name => delete results[name]);
	results = null;
};
const bingTranslation = (word, toCh, isWord, results, tabID) => new Promise(async res => {
	var tag = 'BING::' + word;
	if (isWord) {
		let cache = await window.transCache.get(tag);
		if (!!cache) {
			results.bing = cache;
			chrome.tabs.sendMessage(tabID, { event: 'GotTranslation', action: results });
			return res();
		}
	}

	console.info('开始 BING 翻译……');
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://www.bing.com/ttranslatev3?isVertical=1&&IG=ADB683081E9A478ABE32091C15345F9A&IID=translator.5028.1', true);
	xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = async () => {
		if (xhr.readyState == 4) {
			if (xhr.status === 0 || xhr.response === '') return res();
			var json;
			try {
				json = JSON.parse(xhr.responseText);
			} catch {
				return res();
			}
			json = json[0];
			if (!json) return res();
			json = json.translations;
			if (!json) return res();
			json = json[0];
			if (!json) return res();
			json = json.text;
			if (!json) return res();
			if (isWord) await window.transCache.set(tag, json);
			results.bing = json;
			console.info('BING 成功翻译结束');
			chrome.tabs.sendMessage(tabID, { event: 'GotTranslation', action: results });
			res();
		}
	};
	xhr.send('&text=' + encodeURI(word) + '&fromLang=auto-detect&to=' + (toCh ? 'zh-Hans' : 'en'));
});
const icibaTranslation = (word, toCh, isWord, results, tabID) => new Promise(async res => {
	var tag = 'ICIBA::' + word;
	if (isWord) {
		let cache = await window.transCache.get(tag);
		if (!!cache) {
			results.iciba = cache;
			chrome.tabs.sendMessage(tabID, { event: 'GotTranslation', action: results });
			return res();
		}
	}

	console.info('开始词霸翻译……');
	var url = "http://fy.iciba.com/ajax.php?a=fy";
	var page = await xhr(url, 'post', {
		// f: 'auto',
		// t: 'auto',
		f: toCh ? 'en' : 'zh',
		t: toCh ? 'zh' : 'en',
		w: word
	});
	if (!page) return res();
	page = page[0];
	if (!page) return res();

	try {
		page = JSON.parse(page);
	} catch (err) {
		return rej(err);
	}

	if (page.status !== 1) return res();
	page = page.content;
	if (!page) return res();
	page = page.out;
	if (!page) return res();
	results.iciba = page;
	if (isWord) await window.transCache.set(tag, page);
	console.info('词霸成功翻译结束');
	chrome.tabs.sendMessage(tabID, { event: 'GotTranslation', action: results });
	res();
});
const caiyunTranslation = (word, toCh, isWord, results, tabID) => new Promise(async res => {
	var tag = 'CAIYUN::' + word;
	if (isWord) {
		let cache = await window.transCache.get(tag);
		if (!!cache) {
			results.caiyun = cache;
			chrome.tabs.sendMessage(tabID, { event: 'GotTranslation', action: results });
			return res();
		}
	}

	console.info('开始彩云翻译……');
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://api.interpreter.caiyunai.com/v1/translator', true);
	xhr.setRequestHeader('content-type', 'application/json');
	xhr.setRequestHeader('x-authorization', 'token:j3iz6kyni1zu86crbsp7');
	xhr.onreadystatechange = async () => {
		if (xhr.readyState == 4) {
			if (xhr.status === 0 || xhr.response === '') return res();
			var json;
			try {
				json = JSON.parse(xhr.responseText);
			} catch {
				return res();
			}
			json = json.target || 'Unknown';
			if (Array.isArray(json)) json = json.join('\n');
			results.caiyun = json;
			if (isWord) await window.transCache.set(tag, json);
			console.info('彩云成功翻译结束');
			chrome.tabs.sendMessage(tabID, { event: 'GotTranslation', action: results });
			res();
		}
	};
	var dir = '';
	var jps = (word.match(JapaneseChars) || []).length;
	var zhs = (word.match(ChineseChars) || []).length;
	var ens = (word.match(/[a-z]+/gi) || []).length;
	if (toCh) {
		if (jps >= ens) dir = 'ja2zh';
		else dir = 'en2zh';
	} else {
		if (jps >= zhs) dir = 'ja2en';
		else dir = 'zh2en'
	}
	xhr.send(JSON.stringify({
		'source': [word],
		'trans_type': dir,
		'request_id': 'demo',
		"detect": true,
		"media": "text"
	}));
});

const archieveArticle = async (fingerprint, title, content, url, tabID) => {
	var cache = await archieveCache.get(fingerprint);
	var changed = false, status = 0;
	if (!cache) {
		changed = true;
		status = 1;
		cache = { title, content, usage: [url], update: Date.now() };
	} else {
		status = 2;
		if (title.length > cache.title.length) {
			changed = true;
			cache.title = title;
			cache.update = Date.now();
		}
		if (content.length > cache.content.length) {
			changed = true;
			cache.content = content;
			cache.update = Date.now();
		}
		if (!cache.usage.includes(url)) {
			changed = true;
			cache.usage.push(url);
			cache.update = Date.now();
		}
	}
	if (changed) {
		await archieveCache.set(fingerprint, cache);
		if (status === 1) console.info('新增存档：' + fingerprint + ' (' + JSON.stringify(cache).length + ' bytes)');
		else if (status === 2) console.info('更新存档：' + fingerprint + ' (' + JSON.stringify(cache).length + ' bytes)');
	}
	else status = 0;
	chrome.tabs.sendMessage(tabID, { event: 'ArticleArchieved', fingerprint, status });
};
const viewArchieve = () => chrome.tabs.create({ url: chrome.runtime.getURL('/page/archieve.html'), active: true });
const unarchieveArticle = async (fingerprint, tabID) => {
	await archieveCache.del(fingerprint);
	chrome.tabs.sendMessage(tabID, {
		event: 'ArchieveDeleted',
		fingerprint: fingerprint
	});
};
const modifyArchieveTitle = async (fingerprint, title, tabID) => {
	var content = await archieveCache.get(fingerprint);
	if (!content) {
		chrome.tabs.sendMessage(tabID, {
			event: 'ArchieveTitleModified',
			fingerprint: fingerprint,
			ok: false,
			err: '存档已被删'
		});
		return;
	}
	if (content.title === title) return;
	content.title = title;
	// content.update = Date.now();
	await archieveCache.set(fingerprint, content);
	chrome.tabs.sendMessage(tabID, {
		event: 'ArchieveTitleModified',
		fingerprint: fingerprint,
		ok: true,
		title
	});
};
const modifyArchieve = async (fingerprint, content, tabID) => {
	var article = await archieveCache.get(fingerprint);
	if (!article) return;
	if (article.content === content) return;
	article.content = content;
	// article.update = Date.now();
	var fp = SHA256.FingerPrint(content);
	if (fp === fingerprint) {
		await archieveCache.set(fingerprint, article);
		console.info('文档更新：' + fingerprint);
	}
	else {
		await Promise.all([
			archieveCache.del(fingerprint),
			archieveCache.set(fp, article)
		]);
		console.info('文档（' + fingerprint + '）更新新指纹：' + fp);
		fingerprint = fp;
	}

	chrome.tabs.sendMessage(tabID, {
		event: 'ArchieveModified',
		fingerprint: fingerprint,
		ok: true
	});
};

const getArticleList = async (tabID) => {
	var list = await window.libraryStorage.all();
	chrome.tabs.sendMessage(tabID, { event: 'GetArticleList', data: list });
};
const getArticleByID = async (id, tabID) => {
	var article = await window.libraryStorage.get(id);
	chrome.tabs.sendMessage(tabID, { event: 'GetArticleByID', data: article });
};
const saveArticle = async (article, originID, tabID) => {
	if (!article || !article.id) return;
	var [saved, unused] = await Promise.all([
		libraryStorage.set(article),
		archieveCache.del(originID)
	]);
	chrome.tabs.sendMessage(tabID, { event: 'SaveArticle', saved, id: article.id });
};
const getArticleCategories = tabID => {
	chrome.tabs.sendMessage(tabID, { event: 'GetArticleCategories', data: libraryStorage.categories() });
};
const addCategories = async (cateName, tabID) => {
	cateName = cateName.replace(/[ ,，；;、　\?？&!！=]+/g, '');
	libraryStorage.newCate(cateName);
	chrome.tabs.sendMessage(tabID, { event: 'GetArticleCategories', data: libraryStorage.categories() });
};
const modifyArticleCategories = async (category, tabID) => {
	var list = await libraryStorage.setCate(category);
	chrome.tabs.sendMessage(tabID, { event: 'GetArticleCategories', data: list });
};
const deleteArticleCategories = async (target, tabID) => {
	if (Array.isArray(target)) {
		let actions = target.map(name => libraryStorage.delCate(name));
		await Promise.all(actions);
	}
	else {
		await libraryStorage.delCate(target);
	}
	chrome.tabs.sendMessage(tabID, { event: 'GetArticleCategories', data: libraryStorage.categories() });
};
window.refreshLibrary = () => {
	window.libraryStorage.refresh();
};

const getBackendServer = (tabID) => {
	var bs = ExtConfigManager.get('BackendServer');
	chrome.tabs.sendMessage(tabID, {
		event: "GetBackendServer",
		data: bs
	});
};

const publishArticle = async (id, tabID) => {
	var article = await window.libraryStorage.get(id);
	chrome.tabs.sendMessage(tabID, { event: 'PublishArticle', data: article });
};

ExtConfigManager(DefaultExtConfig, (event, key, value) => {
	if (event === 'init') onInit(key);
	else if (event === 'update') onUpdate(key, value);
});

const menus = [];
const createMenu = (id, title, parent, onlySelection=false) => new Promise(res => {
	if (menus.includes(id)) return;
	menus.push(id);

	var option = {
		id,
		title,
		contexts: []
	};
	if (!!parent) option.parentId = parent;
	if (onlySelection) option.contexts.push('selection');
	else option.contexts.push('page', 'selection');

	chrome.contextMenus.create(option, res);
});
const removeMenu = id => new Promise(res => {
	if (!menus.includes(id)) return res();

	chrome.contextMenus.remove(id, () => {
		var index = menus.indexOf(id);
		if (index >= 0) menus.splice(index, 1);
		res();
	});
});
const UpdateContentMenu = async () => {
	await removeMenu('search_resource_entry');
	menus.splice(0, menus.length);

	await createMenu('search_resource_entry', '搜索资源');

	var actions = [];
	actions.push(createMenu('search_resource', '搜索所有资源(ctrl+ctrl+S)', 'search_resource_entry'));
	actions.push(createMenu('search_article_entry', '搜索文章', 'search_resource_entry'));
	actions.push(createMenu('search_book_entry', '搜索书籍', 'search_resource_entry'));
	actions.push(createMenu('search_pedia_entry', '搜索百科', 'search_resource_entry'));
	actions.push(createMenu('search_video_entry', '搜索视频', 'search_resource_entry'));
	actions.push(createMenu('search_news_entry', '搜索新闻', 'search_resource_entry'));
	actions.push(createMenu('search_common_entry', '综合搜索', 'search_resource_entry'));
	await Promise.all(actions);

	actions = [];
	actions.push(createMenu('search_article', '搜索所有引擎', 'search_article_entry'));
	ExtConfigManager.get('ArticleSource').forEach((eng, index) => {
		actions.push(createMenu('search_article::' + index, eng.name, 'search_article_entry', true));
	});
	await Promise.all(actions);

	actions = [];
	actions.push(createMenu('search_book', '搜索所有引擎', 'search_book_entry'));
	ExtConfigManager.get('BookSource').forEach((eng, index) => {
		actions.push(createMenu('search_book::' + index, eng.name, 'search_book_entry', true));
	});
	await Promise.all(actions);

	actions = [];
	actions.push(createMenu('search_pedia', '搜索所有引擎', 'search_pedia_entry'));
	ExtConfigManager.get('PediaSource').forEach((eng, index) => {
		actions.push(createMenu('search_pedia::' + index, eng.name, 'search_pedia_entry', true));
	});
	await Promise.all(actions);

	actions = [];
	actions.push(createMenu('search_video', '搜索所有引擎', 'search_video_entry'));
	ExtConfigManager.get('VideoSource').forEach((eng, index) => {
		actions.push(createMenu('search_video::' + index, eng.name, 'search_video_entry', true));
	});
	await Promise.all(actions);

	actions = [];
	actions.push(createMenu('search_news', '搜索所有引擎', 'search_news_entry'));
	ExtConfigManager.get('NewsSource').forEach((eng, index) => {
		actions.push(createMenu('search_news::' + index, eng.name, 'search_news_entry', true));
	});
	await Promise.all(actions);

	actions = [];
	actions.push(createMenu('search_common', '搜索所有引擎', 'search_common_entry'));
	ExtConfigManager.get('CommonSource').forEach((eng, index) => {
		actions.push(createMenu('search_common::' + index, eng.name, 'search_common_entry', true));
	});
	await Promise.all(actions);
};

const sendMenuAction = (event, action, id) => new Promise(res => {
	chrome.tabs.getSelected(tab => {
		chrome.tabs.sendMessage(tab.id, {
			event, action, id
		});
	});
});
chrome.tabs.onActivated.addListener(evt => {
	chrome.tabs.get(evt.tabId, tab => {
		UpdateContentMenu(tab.url);
	});
});
chrome.contextMenus.onClicked.addListener(evt => {
	var target = evt.menuItemId.split('::');
	var id = target[1] * 1;
	target = target[0];

	if (target === 'toggle_translation') {
		sendMenuAction('ToggleTranslation', null, null);
	} else if (target === 'search_resource') {
		sendMenuAction('ToggleSearch', 'All', null);
	} else if (target === 'toggle_archieve') {
		sendMenuAction('ToggleArchieve', null, null);
	} else if (target === 'search_article') {
		if (isNumber(id)) sendMenuAction('ToggleSearch', 'Article', id);
		else sendMenuAction('ToggleSearch', 'Article', null);
	} else if (target === 'search_book') {
		if (isNumber(id)) sendMenuAction('ToggleSearch', 'Book', id);
		else sendMenuAction('ToggleSearch', 'Book', null);
	} else if (target === 'search_pedia') {
		if (isNumber(id)) sendMenuAction('ToggleSearch', 'Pedia', id);
		else sendMenuAction('ToggleSearch', 'Pedia', null);
	} else if (target === 'search_video') {
		if (isNumber(id)) sendMenuAction('ToggleSearch', 'Video', id);
		else sendMenuAction('ToggleSearch', 'Video', null);
	} else if (target === 'search_news') {
		if (isNumber(id)) sendMenuAction('ToggleSearch', 'News', id);
		else sendMenuAction('ToggleSearch', 'News', null);
	} else if (target === 'search_common') {
		if (isNumber(id)) sendMenuAction('ToggleSearch', 'Common', id);
		else sendMenuAction('ToggleSearch', 'Common', null);
	}
});
chrome.commands.onCommand.addListener(cmd => {
	if (cmd === 'toggle-translation') sendMenuAction('ToggleTranslation', null, null);
	else if (cmd === 'toggle-archieve') sendMenuAction('ToggleArchieve', null, null);
	else if (cmd === 'view-archieve') viewArchieve();
	else if (cmd === 'toggle-search') sendMenuAction('ToggleSearch', 'All', null);
	else if (cmd === 'view-editor') chrome.tabs.create({ url: chrome.runtime.getURL('/markup/editor.html'), active: true });
});
chrome.contextMenus.create({
	id: 'toggle_translation',
	title: '翻译本段(Alt+T / ctrl+ctrl+T)',
	contexts: [ 'selection' ]
});
chrome.contextMenus.create({
	id: 'toggle_archieve',
	title: '内容存档(Alt+A / ctrl+ctrl+A)',
	contexts: [ 'page', 'selection' ]
});
chrome.webRequest.onBeforeRequest.addListener(req => {
	console.log(req);
	var config = ExtConfigManager.get('BackendServer');
	var request = req.url.replace('http://starport.contverse.gfs/resource/', '');
	request = request.split('.');
	var url = 'http://' + config.host + ':' + config.port + '/resource/' + request[1] + '/' + request[0];
	console.log(url);
	return {redirectUrl: url};
}, {urls: ['http://starport.contverse.gfs/resource/*']}, ['blocking']);