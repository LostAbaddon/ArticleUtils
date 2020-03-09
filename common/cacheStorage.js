class CacheStorage {
	#DBName;
	#DBVersion;

	#resourceExpire = Infinity;
	#resourceGCInterval = 1000 * 3600 * 6; // 小时 * 1000 * 3600
	#resourceCacheLimit = 1024 * 1024 * 500; // 容量* 1024 * 1024 bytes

	#cacheDB;
	#lastGC = 0;
	#autoGC;

	constructor (dbName, dbVersion) {
		this.#DBName = dbName;
		this.#DBVersion = dbVersion;
	}
	init (expire, interval, limit, onMigrate, callback) {
		return new Promise(async res => {
			if (isNumber(expire) && expire > 0) this.#resourceExpire = expire * 1000 * 3600; // expire 单位是小时
			if (isNumber(interval) && interval > 0) this.#resourceGCInterval = interval * 1000 * 3600; // GC 时间间隔，单位是小时
			if (isNumber(limit) && limit > 0) this.#resourceCacheLimit = limit * 1024 * 1024; // 缓存大小，单位是 MB

			var needMigrate = false;
			this.#cacheDB = new CachedDB(this.#DBName, this.#DBVersion);
			this.#cacheDB.onUpdate(() => {
				needMigrate = true;
				this.#cacheDB.open('menu', 'url');
				this.#cacheDB.open('cache', 'url');
				this.#cacheDB.open('status', 'name');
			});
			this.#cacheDB.onConnect(() => {
				this.#cacheDB.cache('menu', 200);
				this.#cacheDB.cache('cache', 50);
				this.#cacheDB.cache('status', 10);
			});
			await this.#cacheDB.connect();

			if (needMigrate && !!onMigrate) onMigrate(this.#cacheDB);

			var test = Date.now();
			await this.startFullGC();
			test = Date.now() - test;

			if (!!callback) callback();
			res();
		});
	}
	set (url, data, callback) {
		return new Promise(async res => {
			var usage, delta = 0, totalSize, actions;
			actions = [
				new Promise(async res => { usage = await this.#cacheDB.get('menu', url); res(); }),
				new Promise(async res => { totalSize = await this.#cacheDB.get('status', 'TotalSize'); res(); })
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
				this.#cacheDB.set('menu', url, usage),
				this.#cacheDB.set('cache', url, data),
				this.#cacheDB.set('status', 'TotalSize', totalSize)
			];
			await Promise.all(actions);

			if (Date.now() - usage.stamp >= this.#resourceExpire || totalSize >= this.#resourceCacheLimit) {
				await this.startGC();
			}

			if (!!callback) callback();
			res();
		});
	}
	get (url, callback) {
		return new Promise(async res => {
			var usage, data;
			var actions = [
				new Promise(async res => { usage = await this.#cacheDB.get('menu', url); res(); }),
				new Promise(async res => { data = await this.#cacheDB.get('cache', url); res(); })
			];
			await Promise.all(actions);

			if (!!usage && data !== undefined) {
				usage.usage ++;
				await this.#cacheDB.set('menu', url, usage);
			}
			else if (!usage && data !== undefined) {
				data = undefined;
				await this.#cacheDB.del('cache', url);
			}
			else if (!!usage && data === undefined) {
				usage = undefined;
				await this.#cacheDB.del('menu', url);
			}

			if (!!usage) {
				if (Date.now() - usage.stamp >= this.#resourceExpire) {
					await Promise.all([
						this.#cacheDB.del('menu', url),
						this.#cacheDB.del('cache', url)
					]);
					data = undefined;
				}
			}

			if (!!callback) callback(data);
			res(data);
		});
	}
	del (url, callback) {
		return new Promise(async res => {
			var usage, totalSize, actions;
			actions = [
				new Promise(async res => { usage = await this.#cacheDB.get('menu', url); res(); }),
				new Promise(async res => { totalSize = await this.#cacheDB.get('status', 'TotalSize'); res(); }),
				this.#cacheDB.del('cache', url)
			];
			await Promise.all(actions);

			if (!!usage) {
				totalSize -= usage.size;
				await this.#cacheDB.set('status', 'TotalSize', totalSize);
			}

			if (!!callback) callback(content);
			res(content);
		});
	}
	clear (callback) {
		return new Promise(async res => {
			var usage, totalSize, actions;
			actions = [
				this.#cacheDB.clear('menu'),
				this.#cacheDB.clear('cache'),
				this.#cacheDB.clear('status', 'TotalSize', 0)
			];
			await Promise.all(actions);

			if (!!callback) callback();
			res();
		});
	}
	changeExpire (value) {
		if (!isNumber(value)) return;
		if (value < 0) return;
		this.#resourceExpire = value * 1000 * 3600;
		this.startGC();
	}
	changeGCInterval (value) {
		if (!isNumber(value)) return;
		if (value < 0) return;
		this.#resourceGCInterval = value * 1000 * 3600;
	}
	changeCacheLimit (value) {
		if (!isNumber(value)) return;
		if (value < 0) return;
		this.#resourceCacheLimit = value * 1024 * 1024;
		this.startGC();
	}
	getUsage () {
		return new Promise(async res => {
			var total = await this.#cacheDB.get('status', 'TotalSize');
			res([total, total / this.#resourceCacheLimit]);
		})
	}

	startGC () {
		return new Promise(async res => {
			if (!!this.#autoGC) {
				clearTimeout(this.#autoGC);
				this.#autoGC = null;
			}

			this.#lastGC = Date.now();

			var allCache, allUsage, totalSize, actions = [];
			actions.push(new Promise(async res => {
				allCache = await this.#cacheDB.all('cache');
				res();
			}));
			actions.push(new Promise(async res => {
				allUsage = await this.#cacheDB.all('menu');
				res();
			}));
			actions.push(new Promise(async res => {
				totalSize = await this.#cacheDB.get('status', 'TotalSize');
				res();
			}));
			await Promise.all(actions);

			actions = [];
			var count = 0;
			Object.keys(allUsage).forEach(url => {
				var usage = allUsage[url];
				if (this.#lastGC - usage.stamp >= this.#resourceExpire) {
					totalSize -= usage.size;
					count ++;
					actions.push(this.#cacheDB.del('menu', url));
					actions.push(this.#cacheDB.del('cache', url));
					delete allCache[url];
					delete allUsage[url];
				}
			});
			if (count > 0) {
				actions.push(this.#cacheDB.set('status', 'TotalSize', totalSize));
			}
			await Promise.all(actions);
			if (count > 0) {
				console.info('本次 GC 共删除 ' + count + ' 条记录。目前缓存占用了 ' + totalSize + 'bytes。');
			}

			if (totalSize >= this.#resourceCacheLimit) {
				let list = Object.keys(allUsage);
				list = list.map(url => {
					var usage = allUsage[url];
					return {
						url,
						stamp: this.#lastGC - usage.stamp,
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
					if (total >= this.#resourceCacheLimit) return true;
					return false;
				});
				if (index > 0) {
					total -= last;
					list.splice(0, index);
					actions = [];
					list.forEach(item => {
						item = item.url;
						actions.push(this.#cacheDB.del('menu', item));
						actions.push(this.#cacheDB.del('cache', item));
						delete allCache[item];
						delete allUsage[item];
					});
					actions.push(this.#cacheDB.set('status', 'TotalSize', total));
					await Promise.all(actions);
					console.info('删除 ' + list.length + ' 条低权重记录');
				}
			}

			console.info('当前缓存有 ' + Object.keys(allCache).length + ' 条记录');

			this.#autoGC = setTimeout(() => {
				this.startFullGC();
			}, this.#resourceGCInterval);
			res();
		});
	}
	startFullGC () {
		return new Promise(async res => {
			if (!!this.#autoGC) {
				clearTimeout(this.#autoGC);
				this.#autoGC = null;
			}

			var allCache, allUsage, actions = [];
			actions.push(new Promise(async res => {
				allCache = await this.#cacheDB.all('cache');
				res();
			}));
			actions.push(new Promise(async res => {
				allUsage = await this.#cacheDB.all('menu');
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
					actions.push(this.#cacheDB.set('menu', url, {
						stamp: Date.now(),
						usage: 1,
						size
					}));
				} else if (usage.size !== size) {
					count ++;
					usage.size = size;
					actions.push(this.#cacheDB.set('menu', url, usage));
				}
			});
			shouldRemoves.forEach(url => actions.push(this.#cacheDB.del('menu', url)));
			actions.push(this.#cacheDB.set('status', 'TotalSize', totalSize));
			await Promise.all(actions);
			if (shouldRemoves.length + count > 0) {
				console.info("一级清理删除 " + shouldRemoves.length + ' 条记录，修正 ' + count + ' 条记录。');
			}
			console.info("当前缓存共用了 " + totalSize + ' bytes (' + (Math.round(totalSize / this.#resourceCacheLimit * 10000) / 100) + '%)');

			await this.startGC();

			res();
		});
	}
}