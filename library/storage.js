class LibraryStatus {
	totalArticle = 0;
	totalSize = 0;
	constructor (count, size) {
		this.totalArticle = count || 0;
		this.totalSize = size || 0;
	}
}

class ArticleInfo {
	id = '';
	fingerprint = '';
	title = '';
	description = '';
	update = 0;
	category = []; // 分类
	type = 0; // 0: 普通文章；1：书目；2：文集；3：专题
	size = 0;
}
class Article extends ArticleInfo {
	content = '';

	getInfo () {
		var info = new ArticleInfo();
		info.id = this.id;
		info.fingerprint = this.fingerprint;
		info.description = this.description;
		info.title = this.title;
		info.update = this.update;
		info.category = this.category.map(c => c);
		info.type = this.type;
		info.size = this.size;
		return info;
	}

	static fromJSON (json) {
		var article = new Article();
		article.fingerprint = json.fingerprint || SHA256.FingerPrint(json.content);
		article.id = json.id || json.fingerprint;
		article.title = json.title || '无名之文';
		article.description = json.description || Article.getDescription(json.content);
		article.content = json.content;
		article.update = json.stamp || Date.now();
		article.category = json.category || [];
		article.type = json.type || 0;
		article.size = json.content.length;
		return article;
	}
	static fromText (content, title) {
		var article = new Article();
		article.fingerprint = SHA256.FingerPrint(json.content);
		article.id = json.fingerprint;
		article.title = title || '无名之文';
		article.description = Article.getDescription(content);
		article.content = content;
		article.update = Date.now();
		article.category = [];
		article.type = 0;
		article.size = content.length;
		return article;
	}
	static getDescription (content) {
		var desc = content.substring(0, 250);
		desc = desc.replace(/[\+\-\*>=~`$\?\\\/!\^\|]+/g, '');
		desc = desc.substring(0, 140);
		return desc;
	}
}

class Category {
	name = '';
	sups = [];
	subs = [];
	articles = [];
	constructor (name) {
		this.name = name;
	}
}

class LibraryStorage {
	static DBName = 'Library';
	static DBVersion = 2;

	#cacheDB;
	#info;
	#categories;

	init (onMigrate, callback) {
		return new Promise(async res => {
			this.#cacheDB = new CachedDB(LibraryStorage.DBName, LibraryStorage.DBVersion);
			this.#cacheDB.onUpdate(() => {
				this.#cacheDB.open('articles', 'id');
				this.#cacheDB.open('category', 'name');
				this.#cacheDB.open('info', 'id');
				this.#cacheDB.open('status', 'name');
				if (!!onMigrate) onMigrate(this.#cacheDB);
			});
			this.#cacheDB.onConnect(() => {
				this.#cacheDB.cache('articles', 10);
				this.#cacheDB.cache('category', 50);
				this.#cacheDB.cache('info', 50);
				this.#cacheDB.cache('status', 10);
			});
			await this.#cacheDB.connect();

			var [info, cateList] = await Promise.all([
				this.#cacheDB.get('status', 'Info'),
				this.#cacheDB.all('category')
			]);

			if (!info) this.#info = new LibraryStatus(0, 0);
			else this.#info = new LibraryStatus(info.count, info.size);

			if (!cateList) {
				let cate = new Category('#root');
				this.#categories = {};
				this.#categories['#root'] = cate;
			}
			else {
				this.#categories = cateList;
				if (!this.#categories['#root']) this.#categories['#root'] = new Category('#root');
			}

			if (!!callback) callback(this);
			res(this);
		});
	}

	set (article, callback) {
		return new Promise(async res => {
			article = Article.fromJSON(article);
			if (!article) {
				if (!!callback) callback(false);
				return res(false);
			}
			var ifo = article.getInfo();
			var info = await this.#cacheDB.get('info', article.id);
			var cateRemove = [];
			if (!info) {
				this.#info.totalArticle ++;
				this.#info.totalSize += ifo.size;
			}
			else {
				info.category.forEach(kw => {
					if (!ifo.category.includes(kw)) cateRemove.push(kw);
				});
				this.#info.totalSize += ifo.size - info.size;
			}

			var actions = [
				this.#cacheDB.set('articles', ifo.id, article),
				this.#cacheDB.set('info', ifo.id, ifo),
				this.#cacheDB.set('status', 'Info', this.#info),
			];

			cateRemove.forEach(kw => {
				var cate = this.#categories[kw];
				if (!cate) return;
				var idx = cate.articles.indexOf(ifo.id);
				if (idx < 0) return;
				cate.articles.splice(idx, 1);
				actions.push(this.#cacheDB.set('category', cate.name, cate));
			});
			var cates = ifo.category.forEach(c => c);
			if (cates.length === 0) cates.push('#root');
			cates.forEach(kw => {
				var cate = this.#categories[kw];
				if (!cate) {
					cate = new Category(kw);
					this.#categories[kw] = cate;
				}
				else {
					if (cate.articles.includes(ifo.id)) return;
				}
				cate.articles.push(ifo.id);
				actions.push(this.#cacheDB.set('category', cate.name, cate));
			});

			await Promise.all(actions);

			if (!!callback) callback(true);
			res(true);
		});
	}
	get (id, callback) {
		return new Promise(async res => {
			var [article, info] = await Promise.all([
				this.#cacheDB.get('articles', id),
				this.#cacheDB.get('info', id)
			]);

			var result = null;
			if (!article && !!info) {
				this.#info.totalArticle --;
				this.#info.totalSize -= info.size;
				await Promise.all([
					this.#cacheDB.del('info', id),
					this.#cacheDB.set('status', 'Info', this.#info)
				]);
			}
			else if (!!article && !info) {
				this.#info.totalArticle ++;
				this.#info.totalSize += info.size;
				result = Article.fromJSON(article);
				info = article.getInfo();
				await Promise.all([
					this.#cacheDB.set('info', id, info),
					this.#cacheDB.set('status', 'Info', this.#info)
				]);
			}
			else {
				result = Article.fromJSON(article);
			}

			if (!!callback) callback(result);
			res(result);
		});
	}
	del (id, callback) {
		return new Promise(async res => {
			var [article, info] = await Promise.all([
				this.#cacheDB.get('articles', id),
				this.#cacheDB.get('info', id)
			]);

			var actions = [], cate, removes = [];
			actions.push(this.#cacheDB.del('articles', id));
			if (!!info) {
				this.#info.totalArticle --;
				this.#info.totalSize -= info.size;
				actions.push(this.#cacheDB.del('info', id));
				actions.push(this.#cacheDB.set('status', 'Info', this.#info));
				cate = info.category;
			}
			else {
				cate = article.category;
			}
			if (!!cate) {
				cate.forEach(kw => {
					var c = this.#categories[kw];
					if (!c) return;
					var idx = c.articles.indexOf(id);
					if (idx < 0) return;
					c.articles.splice(idx, 1);
					actions.push(this.#cacheDB.del('category', kw));
				});
			}

			await Promise.all(actions);

			if (!!callback) callback();
			res();
		});
	}
	clear (callback) {
		return new Promise(async res => {
			await Promise.all([
				this.#cacheDB.clear('articles'),
				this.#cacheDB.clear('category'),
				this.#cacheDB.clear('info'),
				this.#cacheDB.clear('status'),
			]);

			if (!!callback) callback();
			res();
		});
	}
	all () {
		return new Promise(async res => {
			var list = await this.#cacheDB.all('info');
			res(list);
		});
	}
	categories () {
		return this.#categories;
	}
	async newCate (name) {
		var cate = new Category(name);
		if (!!this.#categories[name]) return false;
		this.#categories[name] = cate;
		await this.#cacheDB.set('category', name, cate);
		return true;
	}
	setCate (cate) {
		return new Promise(async res => {
			var old = this.#categories[cate.name];
			if (!old) {
				this.#categories[cate.name] = cate;
				await this.#cacheDB.set('category', cate.name, cate);
				res(this.#categories);
				return;
			}
			var actions = [];
			actions.push(this.#cacheDB.set('category', cate.name, cate));
			old.sups.forEach(kw => {
				if (cate.sups.includes(kw)) return;
				var c = this.#categories[kw];
				var idx = c.subs.indexOf(cate.name);
				if (idx < 0) return;
				c.subs.splice(idx, 1);
				actions.push(this.#cacheDB.set('category', kw, c));
			});
			cate.sups.forEach(kw => {
				var c = this.#categories[kw];
				var idx = c.subs.indexOf(cate.name);
				if (idx >= 0) return;
				c.subs.push(cate.name);
				actions.push(this.#cacheDB.set('category', kw, c));
			});
			this.#categories[cate.name] = cate;
			await Promise.all(actions);
			res(this.#categories);
		});
	}
	delCate (name) {
		return new Promise(async res => {
			var cate = this.#categories[name];
			if (!cate || cate.articles.length > 0) {
				res(this.#categories);
				return;
			}
			var actions = [this.#cacheDB.del('category', name)];
			Object.keys(this.#categories).forEach(kw => {
				var c = this.#categories[kw];
				var idx = c.sups.indexOf(name);
				if (idx < 0) return;
				c.sups.splice(idx, 1);
				actions.push(this.#cacheDB.set('category', kw, c));
			});
			delete this.#categories[name];
			await Promise.all(actions);
			res(this.#categories);
		});
	}

	refresh () {
		return new Promise(async res => {
			Object.keys(this.#categories).forEach(kw => {
				var cate = this.#categories[kw];
				cate.articles.splice(0, cate.articles.length);
			});
			var all = await this.#cacheDB.all('info');
			var count = 0, size = 0;
			Object.keys(all).forEach(id => {
				var art = all[id];
				count ++;
				size += art.size;
				art.category.forEach(kw => {
					var c = this.#categories[kw];
					if (!c) {
						c = new Category(kw);
						this.#categories[kw] = c;
					}
					c.articles.push(id);
				});
			});
			this.#info.totalArticle = count;
			this.#info.totalSize = size;

			var actions = [this.#cacheDB.set('status', 'Info', this.#info)];
			Object.keys(this.#categories).forEach(kw => {
				actions.push(this.#cacheDB.set('category', kw, this.#categories[kw]));
			});

			await Promis.all(actions);
			res();
		});
	}

	get count () {
		return this.#info.totalArticle;
	}
	get size () {
		return this.#info.totalSize;
	}
}