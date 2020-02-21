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

	root.toUTFX = str => {
		var result = [];
		str.split('').forEach(w => {
			var ascii = w.charCodeAt(0);
			if (ascii < 256 && ascii >= 0) {
				result.push(ascii);
				return;
			}
			if (ascii < 0) {
				let x = Math.ceil(Math.log2(ascii));
				x = Math.ceil(x / 8) * 8;
				x = 2 ** x;
				ascii += x;
			}
			let len = Math.ceil(Math.log2(ascii));
			let bits = Math.ceil(len / 6);
			let chars = [];
			for (let i = 0; i < bits; i ++) {
				let left = Math.floor(ascii / 64);
				let bit = ascii - left * 64;
				ascii = left;
				if (i === bits - 1) {
					chars[bits - 1 - i] = bit + 192;
				} else {
					chars[bits - 1 - i] = bit + 128;
				}
			}
			chars.forEach(c => result.push(c));
		});
		return result;
	};
	root.fromUTFX = codes => {
		var result = '';
		var len = codes.length;
		var left = 0;
		for (let i = 0; i < len; i ++) {
			let c = codes[i];
			if (c < 128) {
				if (left > 0) {
					result = result + String.fromCharCode(left);
					left = 0;
				}
				result = result + String.fromCharCode(c);
			} else if (c > 192) {
				if (left > 0) {
					result = result + String.fromCharCode(left);
					left = 0;
				}
				left = c - 192;
			} else {
				left *= 64;
				left += c - 128;
			}
		}
		if (left > 0) {
			result = result + String.fromCharCode(left);
		}
		return result;
	};
	const BaseX = [];
	const AntiBaseX = {};
	for (let i = 0; i < 26; i ++) {
		BaseX[i] = String.fromCharCode(97 + i);
		BaseX[i + 36] = String.fromCharCode(65 + i);
	}
	for (let i = 0; i < 10; i ++) {
		BaseX[26 + i] = i + '';
	}
	BaseX.push('+');
	BaseX.push('=');
	BaseX.forEach((c, i) => AntiBaseX[c] = i);
	root.toBaseX = codes => {
		codes = [...codes];
		var len = Math.ceil(codes.length / 3) * 3 - codes.length;
		for (let i = 0; i < len; i ++) codes.unshift(0);
		var result = '';
		codes.forEach(c => {
			c = c.toString(2);
			var t = 8 - c.length;
			for (let i = 0; i < t; i ++) c = '0' + c;
			result += c;
		});
		len = result.length / 6;
		var codes = [];
		for (let i = 0; i < len; i ++) {
			let j = result.substr(i * 6, 6);
			j = parseInt(j, 2);
			codes.push(BaseX[j]);
		}
		while (codes[0] === BaseX[0]) {
			codes.splice(0, 1);
		}
		return codes.join('');
	};
	root.fromBaseX = str => {
		var len = Math.ceil(str.length / 4);
		len = len * 4 - str.length;
		for (let i = 0; i < len; i ++) str = BaseX[0] + str;
		var result = '';
		str.split('').forEach(c => {
			c = AntiBaseX[c] || 0;
			c = c.toString(2);
			var t = 6 - c.length;
			for (let i = 0; i < t; i ++) c = '0' + c;
			result += c;
		});
		len = result.length / 8;
		var chars = [];
		for (let i = 0; i < len; i ++) {
			let j = result.substr(i * 8, 8);
			j = parseInt(j, 2);
			chars.push(j);
		}
		while (chars[0] === 0) {
			chars.splice(0, 1);
		}
		return chars;
	};
	root.baseXS2B = str => str.split('').map(s => AntiBaseX[s]);
	root.baseXB2S = chars => chars.map(c => BaseX[c]).join('');
}) (window);
