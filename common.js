// Common Functions

(root => {
	if (root.UtilInitialized) return;
	root.UtilInitialized = true;

	root.wait = (delay=0) => new Promise(res => setTimeout(res, delay));
	root.now = () => Date.now();
	root.isString = str => (typeof str === 'string') || (str instanceof String);
	root.isNumber = num => ((typeof num === 'number') || (num instanceof Number)) && !isNaN(num);
	root.randomize = array => {
		var isStr = false;
		if (isString(array)) {
			isStr = true;
			array = array.split('');
		}
		var result = [], len = array.length, l = len;
		for (let i = 0; i < len; i ++) {
			result.push(array.splice(Math.floor(Math.random() * l), 1)[0]);
			l --;
		}
		if (isStr) result = result.join('');
		return result;
	};

	root.newEle = tagName => document.createElement(tagName);
	root.loadJS = (src, callback) => {
		var script = newEle('script');
		script.type = 'text/javascript';
		script.src = src;
		if (!!callback) script.onload = callback;
		document.body.appendChild(script);
	};

	root.store = {
		set: (key, value, cb) => new Promise(res => {
			if (isString(key)) {
				let data = {};
				data[key] = value;
				key = data;
			} else {
				cb = value;
			}

			chrome.storage.local.set(key, () => {
				if (!!cb) cb();
				res();
			});
		}),
		get: (key, cb) => new Promise(res => {
			if (isString(key)) key = [key]
			chrome.storage.local.get(key, result => {
				if (key.length === 1) {
					result = result[key[0]];
				}
				if (!!cb) cb(result);
				res(result);
			});
		})
	};
	root.syncstore = {
		set: (key, value, cb) => new Promise(res => {
			if (isString(key)) {
				let data = {};
				data[key] = value;
				key = data;
			} else {
				cb = value;
			}

			chrome.storage.sync.set(key, () => {
				if (!!cb) cb();
				res();
			});
		}),
		get: (key, cb) => new Promise(res => {
			if (isString(key)) key = [key]
			chrome.storage.sync.get(key, result => {
				if (key.length === 1) {
					result = result[key[0]];
				}
				if (!!cb) cb(result);
				res(result);
			});
		})
	};
}) (window);
