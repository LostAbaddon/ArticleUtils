const UnavailableChars = /\\\//gi;
const ForbiddenNames = [ 'cache', '快照', '广告', 'here', 'next', 'prev', 'see all', 'see more' ];
const ForbiddenPaths = [ 'cache', 'translate', 'translator', 'ad.', 'javascript:' ];
const SearchItem = ['common', 'book', 'video'];
const ExtHost = chrome.extension.getURL('');

const onInit = config => {
	chrome.runtime.onMessage.addListener((msg, sender, response) => {
		if (msg.event === 'FindResource') {
			// searchResources(msg.targets, config, sender.tab.id);
			store.get('result', result => {
				sendBackResource(sender.tab.id, result);
			});
		}
	});
};

const searchResources = (targets, config, tabID) => {
	var result = {}, task = targets.length;
	if (task === 0) return;
	targets.forEach(async (t) => {
		var list = await searchResource(t, config);
		if (!!list) result[t] = list;

		task --;
		if (task === 0) analyzeResource(tabID, result);
	});
};
const searchResource = (target, config) => new Promise(res => {
	if (!!target.match(UnavailableChars)) return res();

	var task = 3, result = {};
	var done = name => list => {
		if (!!list) result[name] = list;
		task --;
		if (task > 0) return;
		res(result);
	};

	SearchItem.forEach(name => {
		var engine = name.substr(0, 1).toUpperCase() + name.substr(1, name.length).toLowerCase();
		engine = config[engine + 'Source'];
		search(target, engine, done(name));
	});
});
const search = (target, engine, callback) => {
	var result = {}, task = engine.length;
	var done = (list) => {
		if (!!list) {
			list.forEach(item => result[item[1]] = item[0]);
		}
		task --;
		if (task === 0) {
			callback(result);
		}
	};

	engine.forEach(async cfg => {
		if (!cfg.using) return done();
		if (!cfg.host) {
			cfg.host = cfg.url.split('/');
			cfg.host.splice(3, cfg.host.length);
			cfg.host = cfg.host.join('/') + '/';
		}

		var query = target.replace(/ +/g, cfg.connector || '+');
		var url = cfg.url.replace(/\{title\}/g, query), page;
		[page, url] = await xhr(url);

		if (!!cfg.redirect) {
			let reg = new RegExp(cfg.redirect);
			if (url.match(reg)) return done([[target, url]]);
		}

		var low = page.toLowerCase();
		var pos = low.indexOf('<body');
		if (pos < 0) return done();
		page = page.substring(pos, page.length);
		low = low.substring(pos, low.length);
		pos = low.indexOf('>');
		if (pos < 0) return done();
		page = page.substring(pos + 1, page.length);
		low = low.substring(pos + 1, low.length);
		pos = low.indexOf('</body>');
		if (pos < 0) return done();
		page = page.substring(0, pos);
		page = page.replace(/<img.*?\/?>/gi, '');
		page = page.replace(/<script.*?>[\w\W]*?<\/script>/gi, '');
		page = page.replace(/<style.*?>[\w\W]*?<\/style>/gi, '');
		page = page.replace(/^[ \n\t\r]+|[ \n\t\r]+$/g, '');
		if (page.length === 0) return done();

		var container = newEle('div', 'MainContainer');
		container.innerHTML = page;
		await wait();

		container = container.querySelectorAll(cfg.container);
		if (!container || container.length === 0) return done();
		var list = [];
		container.forEach(link => {
			var name, url;
			if (!!cfg.title) {
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
		done(list);
	});
};
const analyzeResource = (tabID, resources) => {
	var result = {};
	Object.keys(resources).forEach(name => {
		var list = resources[name];
		var items = Object.keys(list).filter(n => n !== 'common');
		var commons = list.common;
		if (!!commons) {
			Object.keys(commons).forEach(link => {
				var title = commons[link];
				var has = items.some(item => !!list[item][link]);
				if (has) {
					delete commons[link];
					return;
				}

				var low = link.toLowerCase();
				if (low.indexOf('book') >= 0) {
					list.book[link] = title;
					delete commons[link];
					return;
				} else if (low.indexOf('video') >= 0
					|| !!low.match(/^v\.|\bv\./)) {
					list.video[link] = title;
					delete commons[link];
					return;
				}

				low = title.toLowerCase();
				if (low.indexOf('电子书') >= 0
					|| !!low.match(/pdf|mobi|epub|txt/i)) {
					list.book[link] = title;
					delete commons[link];
				} else if (low.indexOf('电影') >= 0
					|| low.indexOf('视频') >= 0
					|| low.indexOf('磁力') >= 0
					|| low.indexOf('高清') >= 0
					|| low.indexOf('双语') >= 0
					|| low.indexOf('双字') >= 0
					|| low.indexOf('蓝光') >= 0
					|| !!low.match(/BT *下载/i)
					|| (!!low.match(/^movie\.|\bmovie\./i) && !low.match(/^movie\.douban\.|\bmovie\.douban\./i))) {
					list.video[link] = title;
					delete commons[link];
				}
			});
		}
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

	// For Test
	store.set('result', result);

	sendBackResource(tabID, result);
};
const sendBackResource = (tabID, resource) => {
	chrome.tabs.sendMessage(tabID, { event: 'GotResource', resource });
};

ExtConfigManager(DefaultExtConfig, (event, key, value) => {
	if (event === 'init') onInit(key);
});