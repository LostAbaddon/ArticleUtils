(() => {
	const DBName = 'ResourceCache';
	const DBVersion = 1;

	var resourceExpire = Infinity;
	var resourceGCInterval = 1000 * 3600 * 6; // 小时 * 1000 * 3600
	var resourceCacheLimit = 1024 * 1024 * 500; // 容量* 1024 * 1024 bytes

	var cacheDB;
	var lastGC = 0;
	var autoGC;

	const startGC = () => new Promise(async res => {
		if (!!autoGC) {
			clearTimeout(autoGC);
			autoGC = null;
		}

		lastGC = Date.now();

		var allCache, allUsage, totalSize, actions = [];
		actions.push(new Promise(async res => {
			allCache = await cacheDB.all('cache');
			res();
		}));
		actions.push(new Promise(async res => {
			allUsage = await cacheDB.all('menu');
			res();
		}));
		actions.push(new Promise(async res => {
			totalSize = await cacheDB.get('status', 'TotalSize');
			res();
		}));
		await Promise.all(actions);

		actions = [];
		var count = 0;
		Object.keys(allUsage).forEach(url => {
			var usage = allUsage[url];
			if (lastGC - usage.stamp >= resourceExpire) {
				console.log(lastGC, usage.stamp, lastGC - usage.stamp, resourceExpire);
				totalSize -= usage.size;
				count ++;
				actions.push(cacheDB.del('menu', url));
				actions.push(cacheDB.del('cache', url));
				delete allCache[url];
				delete allUsage[url];
			}
		});
		if (count > 0) {
			actions.push(cacheDB.set('status', 'TotalSize', totalSize));
		}
		await Promise.all(actions);
		if (count > 0) {
			console.info('本次 GC 共删除 ' + count + ' 条记录。目前缓存占用了 ' + totalSize + 'bytes。');
		}

		if (totalSize >= resourceCacheLimit) {
			let list = Object.keys(allUsage);
			list = list.map(url => {
				var usage = allUsage[url];
				return {
					url,
					stamp: lastGC - usage.stamp,
					usage: usage.usage,
					size: usage.size,
					index1: 0,
					index2: 0
				}
			});
			list.sort((a, b) => a.stamp - b.stamp);
			list.forEach((item, index) => item.index1 = index);
			list.sort((a, b) => b.usage - a.usage);
			list.forEach((item, index) => item.index2 = index + item.index1);
			list.sort((a, b) => a.index2 - b.index2);
			let total = 0, index = 0, last;
			list.some((item, i) => {
				last = item.size;
				total += last;
				index = i;
				if (total >= resourceCacheLimit) return true;
				return false;
			});
			if (index > 0) {
				total -= last;
				list.splice(0, index);
				actions = [];
				list.forEach(item => {
					item = item.url;
					actions.push(cacheDB.del('menu', item));
					actions.push(cacheDB.del('cache', item));
					delete allCache[item];
					delete allUsage[item];
				});
				actions.push(cacheDB.set('status', 'TotalSize', total));
				await Promise.all(actions);
				console.info('删除 ' + list.length + ' 条低权重记录');
			}
		}

		console.info('当前缓存有 ' + Object.keys(allCache).length + ' 条记录');

		autoGC = setTimeout(startGC, resourceGCInterval);
		res();
	});
	const startFullGC = () => new Promise(async res => {
		if (!!autoGC) {
			clearTimeout(autoGC);
			autoGC = null;
		}

		var allCache, allUsage, actions = [];
		actions.push(new Promise(async res => {
			allCache = await cacheDB.all('cache');
			res();
		}));
		actions.push(new Promise(async res => {
			allUsage = await cacheDB.all('menu');
			res();
		}));
		await Promise.all(actions);

		var shouldRemoves = Object.keys(allUsage), actions = [], totalSize = 0, count = 0;
		Object.keys(allCache).forEach(url => {
			var data = allCache[url];
			var index = shouldRemoves.indexOf(url);
			if (index >= 0) shouldRemoves.splice(index, 1);
			var size = JSON.stringify(data).length;
			totalSize += size;
			var usage = allUsage[url];
			if (!usage) {
				count ++;
				actions.push(cacheDB.set('menu', url, {
					stamp: Date.now(),
					usage: 1,
					size
				}));
			} else if (usage.size !== size) {
				count ++;
				usage.size = size;
				actions.push(cacheDB.set('menu', url, usage));
			}
		});
		shouldRemoves.forEach(url => actions.push(cacheDB.del('menu', url)));
		actions.push(cacheDB.set('status', 'TotalSize', totalSize));
		await Promise.all(actions);
		if (shouldRemoves.length + count > 0) {
			console.info("一级清理删除 " + shouldRemoves.length + ' 条记录，修正 ' + count + ' 条记录。');
		}
		console.info("当前缓存共用了 " + totalSize + ' bytes (' + (Math.round(totalSize / resourceCacheLimit * 10000) / 100) + '%)');

		await startGC();

		res();
	});

	const storage = {
		init: (expire, interval, limit, callback) => new Promise(async res => {
			if (isNumber(expire) && expire > 0) resourceExpire = expire * 1000 * 3600; // expire 单位是小时
			if (isNumber(interval) && interval > 0) resourceGCInterval = interval * 1000 * 3600; // GC 时间间隔，单位是小时
			if (isNumber(limit) && limit > 0) resourceCacheLimit = limit * 1024 * 1024; // 缓存大小，单位是 MB

			var needMigrate = false;
			cacheDB = new CachedDB(DBName, DBVersion);
			cacheDB.onUpdate(() => {
				needMigrate = true;
				cacheDB.open('menu', 'url');
				cacheDB.open('cache', 'url');
				cacheDB.open('status', 'name');
			});
			cacheDB.onConnect(() => {
				cacheDB.cache('menu', 200);
				cacheDB.cache('cache', 50);
				cacheDB.cache('status', 10);
			});
			await cacheDB.connect();

			if (needMigrate) {
				let now = Date.now(), first = Infinity, last = 0;
				let list = await store.get('ResourceCacheMenu');
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
						tasks.push(cacheDB.set('menu', url, {
							stamp: item.stamp,
							usage: item.usage,
							size: size
						}));
						time = now - item.stamp;
						if (time > last) last = time;
						if (time < first) first = time;
						tasks.push(cacheDB.set('cache', url, content));
						await Promise.all(tasks);
						res();
					}));
					await Promise.all(actions);
					await cacheDB.set('status', 'TotalSize', totalSize);
					console.info("已将老版缓存数据迁移到 IndexedDB");
				}
			}

			var test = Date.now();
			await startFullGC();
			test = Date.now() - test;

			if (!!callback) callback();
			res();
		}),
		set: (url, data, callback) => new Promise(async res => {
			var usage, delta = 0, totalSize, actions;
			actions = [
				new Promise(async res => { usage = await cacheDB.get('menu', url); res(); }),
				new Promise(async res => { totalSize = await cacheDB.get('status', 'TotalSize'); res(); })
			];
			await Promise.all(actions);

			if (!usage) {
				usage = {
					stamp: Date.now(),
					usage: 1
				};
			} else {
				usage.usage ++;
				delta = usage.size;
			}
			usage.size = JSON.stringify(data).length;
			delta = usage.size - delta;
			totalSize += delta;

			actions = [
				cacheDB.set('menu', url, usage),
				cacheDB.set('cache', url, data),
				cacheDB.set('status', 'TotalSize', totalSize)
			];
			await Promise.all(actions);

			if (Date.now() - usage.stamp >= resourceExpire || totalSize >= resourceCacheLimit) {
				await startGC();
			}

			if (!!callback) callback();
			res();
		}),
		get: (url, callback) => new Promise(async res => {
			var usage, data;
			var actions = [
				new Promise(async res => { usage = await cacheDB.get('menu', url); res(); }),
				new Promise(async res => { data = await cacheDB.get('cache', url); res(); })
			];
			await Promise.all(actions);

			if (!!usage && data !== undefined) {
				usage.usage ++;
				await cacheDB.set('menu', url, usage);
			}
			else if (!usage && data !== undefined) {
				data = undefined;
				await cacheDB.del('cache', url);
			}
			else if (!!usage && data === undefined) {
				usage = undefined;
				await cache.del('menu', url);
			}

			if (!!usage) {
				if (Date.now() - usage.stamp >= resourceExpire) {
					await Promise.all([
						cacheDB.del('menu', url),
						cacheDB.del('cache', url)
					]);
					data = undefined;
				}
			}

			if (!!callback) callback(data);
			res(data);
		}),
		del: (url, callback) => new Promise(async res => {
			var usage, totalSize, actions;
			actions = [
				new Promise(async res => { usage = await cacheDB.get('menu', url); res(); }),
				new Promise(async res => { totalSize = await cacheDB.get('status', 'TotalSize'); res(); }),
				cacheDB.del('cache', url)
			];
			await Promise.all(actions);

			if (!!usage) {
				totalSize -= usage.size;
				await cacheDB.set('status', 'TotalSize', totalSize);
			}

			if (!!callback) callback(content);
			res(content);
		}),
		clear: callback => new Promise(async res => {
			var usage, totalSize, actions;
			actions = [
				cacheDB.clear('menu'),
				cacheDB.clear('cache'),
				cacheDB.clear('status', 'TotalSize', 0)
			];
			await Promise.all(actions);

			if (!!callback) callback();
			res();
		}),
		changeExpire: value => {
			if (!isNumber(value)) return;
			if (value < 0) return;
			resourceExpire = value * 1000 * 3600;
			startGC();
		},
		changeGCInterval: value => {
			if (!isNumber(value)) return;
			if (value < 0) return;
			resourceGCInterval = value * 1000 * 3600;
		},
		changeCacheLimit: value => {
			if (!isNumber(value)) return;
			if (value < 0) return;
			resourceCacheLimit = value * 1024 * 1024;
			startGC();
		},
		getUsage: () => new Promise(async res => {
			var total = await cacheDB.get('status', 'TotalSize');
			res([total, total / resourceCacheLimit]);
		})
	};

	window.cacheStorage = storage;
}) ();