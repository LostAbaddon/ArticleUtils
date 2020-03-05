(() => {
	const TagMenu = 'ResourceCacheMenu';
	const TagResource = 'Resource::';

	var resourceExpire = Infinity;
	var resourceRate = 1;
	var cacheRecords = [];	//	name, stamp, usage

	const removeExpired = () => new Promise(async res => {
		if (!cacheRecords) return res();

		var task = cacheRecords.length;
		if (task === 0) return res();

		var now = Date.now(), removed = [];
		cacheRecords.forEach(async (item, index) => {
			if (now - item.stamp >= resourceExpire) {
				await store.del(item.name);
				removed.push(index);
			}
			task --;
			if (task === 0) {
				removed.sort((a, b) => b - a);
				removed.forEach(i => cacheRecords.splice(i, 1));
				await store.set(TagMenu, cacheRecords);
				console.info('删除过期项 ' + removed.length + ' 条！');
				res();
			}
		});
	});
	const removeUnderRated = () => new Promise(async res => {
		var sorted = [];
		var now = Date.now();
		cacheRecords.forEach((item, index) => sorted.push([item, now - item.stamp, 0, 0, index]));
		sorted.sort((a, b) => b[1] - a[1]);
		sorted.forEach((line, i) => line[2] = i);
		sorted.sort((a, b) => a[0].usage - b[0].usage);
		sorted.forEach((line, i) => line[3] = i + line[2]);
		sorted.sort((a, b) => {
			var r = a[3] - b[3];
			if (r === 0) r = a[2] - b[2];
			return r;
		});
		var removeRate = await getRemoveRate();
		now = Math.ceil(sorted.length * removeRate);
		sorted = sorted.filter((_, i) => i <= now);
		sorted.sort((a, b) => b[4] - a[4]);
		now = sorted.length;
		sorted.forEach(async item => {
			cacheRecords.splice(item[4], 1);
			await store.del(item[0].name);
			now --;
			if (now === 0) {
				await store.set(TagMenu, cacheRecords);
				console.info('强制回收缓存项 ' + sorted.length + ' 条！');
				if (cacheRecords.length > 0) {
					if (await didOverUsed()) {
						await removeUnderRated();
					}
				}
				res();
			}
		});
	});
	const didOverUsed = () => new Promise(res => {
		chrome.storage.local.getBytesInUse(bytes => {
			res(bytes >= chrome.storage.local.QUOTA_BYTES * resourceRate);
		});
	});
	const getRemoveRate = () => new Promise(res => {
		chrome.storage.local.getBytesInUse(bytes => {
			res(chrome.storage.local.QUOTA_BYTES * resourceRate / bytes);
		});
	});
	const updateExpire = (gc=true) => new Promise(async res => {
		await removeExpired();
		if (cacheRecords.length === 0) return res();

		if (!gc) return res();

		var overUsed = await didOverUsed();
		if (overUsed) {
			await removeUnderRated();
			res();
		} else {
			res();
		}
	});
	const storage = {
		init: (expire, rate, callback) => new Promise(async res => {
			if (isNumber(expire) && expire > 0) resourceExpire = expire * 1000 * 3600; // expire 单位是小时
			if (isNumber(rate) && rate > 0 && rate <= 100) resourceRate = rate / 100;
			var list = await store.get(TagMenu);
			if (!list) list = [];
			cacheRecords = list;
			await updateExpire();
			if (!!callback) callback(cacheRecords);
			res(cacheRecords);
		}),
		set: (url, content, callback) => new Promise(async res => {
			var name = TagResource + url;
			var cache = cacheRecords.filter(item => item.name === name);
			if (cache.length === 0) {
				cache = {
					name,
					stamp: Date.now(),
					usage: 1
				};
				cacheRecords.push(cache);
			} else {
				cache = cache[0];
				cache.stamp = Date.now();
				cache.usage ++;
			}

			await Promise.all([store.set(TagMenu, cacheRecords), store.set(name, content)]);

			if (await didOverUsed()) {
				await updateExpire(false);
			} else {
				await updateExpire(true);
			}

			if (!!callback) callback();
			res();
		}),
		get: (url, callback) => new Promise(async res => {
			var name = TagResource + url;
			var content = await store.get(name);

			var cache = cacheRecords.filter(item => item.name === name);
			if (cache.length === 0) {
				cache = null;
			} else {
				cache = cache[0];
			}

			if (content === undefined) {
				if (!!cache) {
					let index = cacheRecords.indexOf(cache);
					cacheRecords.splice(index, 1);
					await store.set(TagMenu, cacheRecords);
				}
			} else {
				if (!cache) {
					cache = {
						name,
						stamp: Date.now(),
						usage: 1
					};
					cacheRecords.push(cache);
					await Promise.all([store.set(name, cache), store.set(TagMenu, cacheRecords)]);
				} else {
					if (Date.now() - cache.stamp >= resourceExpire) {
						let index = cacheRecords.indexOf(cache);
						if (cache >= 0) cacheRecords.splice(index, 1);
						await Promise.all([store.set(TagMenu, cacheRecords), store.del(name)]);
					} else {
						cache.usage ++;
						await store.set(TagMenu, cacheRecords);
					}
				}
			}

			if (!!callback) callback(content);
			res(content);
		}),
		del: (key, callback) => new Promise(async res => {
			var name = TagResource + url;
			var list = [];
			cacheRecords.forEach((item, i) => {
				if (item.name === name) list.push(i);
			});
			list.reverse();
			list.forEach(i => cacheRecords.splice(i, 1));

			await Promise.all([store.del(name), store.set(TagMenu, cacheRecords)]);

			if (!!callback) callback(content);
			res(content);
		}),
		clear: callback => new Promise(async res => {
			var list = cacheRecords.map(item => item.name);
			list.push(TagMenu);
			await Promise.all(list.map(name => store.del(name)));
			if (!!callback) callback();
			res();
		}),
		changeExpire: value => {
			if (!isNumber(value)) return;
			if (value < 0 || value > 1) return;
			resourceExpire = value * 1000 * 3600;
			removeExpired();
		},
		changeRate: value => {
			if (!isNumber(value)) return;
			if (value < 0 || value >= 100) return;
			resourceRate = value / 100;
			updateExpire(true);
		}
	};

	window.cacheStorage = storage;
}) ();