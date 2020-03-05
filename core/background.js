const UnavailableChars = /\\\//gi;
const ForbiddenNames = [ 'cache', '快照', '广告', 'here', 'next', 'prev', 'see all', 'see more' ];
const ForbiddenPaths = [ 'cache', 'translate', 'translator', 'ad.', 'javascript:' ];
const SearchItem = ['common', 'book', 'video', 'article', 'pedia', 'news'];
const ExtHost = chrome.extension.getURL('');

const onInit = config => {
	chrome.runtime.onMessage.addListener((msg, sender, response) => {
		if (msg.event === 'FindResource') {
			searchResources(msg.targets, msg.action, msg.engine, msg.force, config, sender.tab.id);
		}
	});
	window.cacheStorage.init(config.ResourceExpire * 1, config.CacheRateLimit * 1);
};
const onUpdate = (key, value) => {
	if (key === 'ResourceExpire') window.cacheStorage.changeExpire(value);
	else if (key === 'CacheRateLimit') window.cacheStorage.changeRate(value);
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
			if (!list) list = await analyzePage(page, cfg);

			await window.cacheStorage.set(saveTag, list);
			chrome.storage.local.getBytesInUse(bytes => console.info('更新资源搜索记录缓存，缓存池已用 ' + bytes + ' B (' + (Math.round(bytes / chrome.storage.local.QUOTA_BYTES * 10000) / 100) + '%)'))
		}

		done(list);
	});
};
const analyzePage = (page, cfg) => new Promise(async res => {
	var low = page.toLowerCase();
	var pos = low.indexOf('<body');
	if (pos < 0) return res([]);
	page = page.substring(pos, page.length);
	low = low.substring(pos, low.length);
	pos = low.indexOf('>');
	if (pos < 0) return res([]);
	page = page.substring(pos + 1, page.length);
	low = low.substring(pos + 1, low.length);
	pos = low.indexOf('</body>');
	if (pos < 0) return res([]);
	page = page.substring(0, pos);
	page = page.replace(/<img.*?\/?>/gi, '');
	page = page.replace(/<script.*?>[\w\W]*?<\/script>/gi, '');
	page = page.replace(/<style.*?>[\w\W]*?<\/style>/gi, '');
	page = page.replace(/^[ \n\t\r]+|[ \n\t\r]+$/g, '');
	if (page.length === 0) return res([]);

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

ExtConfigManager(DefaultExtConfig, (event, key, value) => {
	if (event === 'init') onInit(key);
	else if (event === 'update') onUpdate(key, value);
	UpdateContentMenu();
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
	if (!menus.includes(id)) return;

	chrome.contextMenus.remove(id, () => {
		var index = menus.indexOf(id);
		if (index >= 0) menus.splice(index, 1);
		res();
	});
});
const UpdateContentMenu = async () => {
	var actions = menus.map(id => removeMenu(id));
	await Promise.all(actions);

	await createMenu('search_resource_entry', '搜索资源');

	actions = [];
	actions.push(createMenu('search_resource', '搜索所有资源(ctrl+ctrl+s)', 'search_resource_entry'));
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

const sendMenuAction = (action, id) => new Promise(res => {
	chrome.tabs.getSelected(tab => {
		chrome.tabs.sendMessage(tab.id, {
			event: "ToggleSearch",
			action, id
		});
	});
});
chrome.contextMenus.onClicked.addListener(evt => {
	var target = evt.menuItemId.split('::');
	var id = target[1] * 1;
	target = target[0];

	if (target === 'search_resource') {
		sendMenuAction('All', null);
	} else if (target === 'search_article') {
		if (isNumber(id)) sendMenuAction('Article', id);
		else sendMenuAction('Article', null);
	} else if (target === 'search_book') {
		if (isNumber(id)) sendMenuAction('Book', id);
		else sendMenuAction('Book', null);
	} else if (target === 'search_pedia') {
		if (isNumber(id)) sendMenuAction('Pedia', id);
		else sendMenuAction('Pedia', null);
	} else if (target === 'search_video') {
		if (isNumber(id)) sendMenuAction('Video', id);
		else sendMenuAction('Video', null);
	} else if (target === 'search_news') {
		if (isNumber(id)) sendMenuAction('News', id);
		else sendMenuAction('News', null);
	} else if (target === 'search_common') {
		if (isNumber(id)) sendMenuAction('Common', id);
		else sendMenuAction('Common', null);
	}
});