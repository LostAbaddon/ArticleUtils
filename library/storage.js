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

class LibraryStorage {
	static DBName = 'Library';
	static DBVersion = 1;

	#cacheDB;
	#info;

	init (onMigrate, callback) {
		return new Promise(async res => {
			this.#cacheDB = new CachedDB(LibraryStorage.DBName, LibraryStorage.DBVersion);
			this.#cacheDB.onUpdate(() => {
				this.#cacheDB.open('articles', 'id');
				this.#cacheDB.open('info', 'id');
				this.#cacheDB.open('status', 'name');
				if (!!onMigrate) onMigrate(this.#cacheDB);
			});
			this.#cacheDB.onConnect(() => {
				this.#cacheDB.cache('articles', 10);
				this.#cacheDB.cache('info', 50);
				this.#cacheDB.cache('status', 10);
			});
			await this.#cacheDB.connect();

			var info = await this.#cacheDB.get('status', 'Info');
			if (!info) this.#info = new LibraryStatus(0, 0);
			else this.#info = new LibraryStatus(info.count, info.size);

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
			if (!info) {
				this.#info.totalArticle ++;
				this.#info.totalSize += ifo.size;
			}
			else {
				this.#info.totalSize += ifo.size - info.size;
			}
			await Promise.all([
				this.#cacheDB.set('articles', ifo.id, article),
				this.#cacheDB.set('info', ifo.id, ifo),
				this.#cacheDB.set('status', 'Info', this.#info),
			]);

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

			if (!!info) {
				this.#info.totalArticle --;
				this.#info.totalSize -= info.size;
				await Promise.all([
					this.#cacheDB.del('articles', id),
					this.#cacheDB.del('info', id),
					this.#cacheDB.set('status', 'Info', this.#info)
				]);
			}
			else {
				await this.#cacheDB.del('articles', id);
			}

			if (!!callback) callback();
			res();
		});
	}
	clear (callback) {
		return new Promise(async res => {
			await Promise.all([
				this.#cacheDB.clear('articles'),
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

	refresh () {
		return new Promise(async res => {
			var all = await this.#cacheDB.all('info');
			var count = 0, size = 0;
			Object.keys(all).forEach(id => {
				count ++;
				size += all[id].size;
			});
			this.#info.totalArticle = count;
			this.#info.totalSize = size;
			await this.#cacheDB.set('status', 'Info', this.#info);
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