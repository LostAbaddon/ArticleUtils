const MUEditor = document.querySelector('#MUEditor');
const MUPreview = document.querySelector('#MUPreview');
const FileLoader = document.querySelector('#fileLoader');

MathJax.Hub.Config({
	extensions: ["tex2jax.js"],
	TeX: {
		extensions: ["AMSmath.js", "AMSsymbols.js"]
	},
	jax: ["input/TeX", "output/HTML-CSS"],
	tex2jax: {
		inlineMath: [["$","$"]]}
	}
);

const DefaultFontAwesomeIcons = ["glass", "music", "search", "envelope", "heart", "star", "star-empty", "user", "film", "th-large", "th", "th-list", "ok", "remove", "zoom-in", "zoom-out", "off", "signal", "cog", "trash", "home", "file", "time", "road", "download-alt", "download", "upload", "inbox", "play-circle", "repeat", "refresh", "list-alt", "lock", "flag", "headphones", "volume-off", "volume-down", "volume-up", "qrcode", "barcode", "tag", "tags", "book", "bookmark", "print", "camera", "font", "bold", "italic", "text-height", "text-width", "align-left", "align-center", "align-right", "align-justify", "list", "indent-left", "indent-right", "facetime-video", "picture", "pencil", "map-marker", "adjust", "tint", "edit", "share", "check", "move", "step-backward", "fast-backward", "backward", "play", "pause", "stop", "forward", "fast-forward", "step-forward", "eject", "chevron-left", "chevron-right", "plus-sign", "minus-sign", "remove-sign", "ok-sign", "question-sign", "info-sign", "screenshot", "remove-circle", "ok-circle", "ban-circle", "arrow-left", "arrow-right", "arrow-up", "arrow-down", "share-alt", "resize-full", "resize-small", "plus", "minus", "asterisk", "exclamation-sign", "gift", "leaf", "fire", "eye-open", "eye-close", "warning-sign", "plane", "calendar", "random", "comment", "magnet", "chevron-up", "chevron-down", "retweet", "shopping-cart", "folder-close", "folder-open", "resize-vertical", "resize-horizontal", "bar-chart", "twitter-sign", "facebook-sign", "camera-retro", "key", "cogs", "comments", "thumbs-up", "thumbs-down", "star-half", "heart-empty", "signout", "linkedin-sign", "pushpin", "external-link", "signin", "trophy", "github-sign", "upload-alt", "lemon", "phone", "check-empty", "bookmark-empty", "phone-sign", "twitter", "facebook", "github", "unlock", "credit-card", "rss", "hdd", "bullhorn", "bell", "certificate", "hand-right", "hand-left", "hand-up", "hand-down", "circle-arrow-left", "circle-arrow-right", "circle-arrow-up", "circle-arrow-down", "globe", "wrench", "tasks", "filter", "briefcase", "fullscreen", "group", "link", "cloud", "beaker", "cut", "copy", "paper-clip", "save", "sign-blank", "reorder", "list-ul", "list-ol", "strikethrough", "underline", "table", "magic", "truck", "pinterest", "pinterest-sign", "google-plus-sign", "google-plus", "money", "caret-down", "caret-up", "caret-left", "caret-right", "columns", "sort", "sort-down", "sort-up", "envelope-alt", "linkedin", "undo", "legal", "dashboard", "comment-alt", "comments-alt", "bolt", "sitemap", "umbrella", "paste", "lightbulb", "exchange", "cloud-download", "cloud-upload", "user-md", "stethoscope", "suitcase", "bell-alt", "coffee", "food", "file-alt", "building", "hospital", "ambulance", "medkit", "fighter-jet", "beer", "h-sign", "plus-sign-alt", "double-angle-left", "double-angle-right", "double-angle-up", "double-angle-down", "angle-left", "angle-right", "angle-up", "angle-down", "desktop", "laptop", "tablet", "mobile-phone", "circle-blank", "quote-left", "quote-right", "spinner", "circle", "reply"];

const newEle = (tagName, classList, id) => {
	var ele = document.createElement(tagName);
	if (!!id) ele.id = id;
	if (!!classList) {
		if (classList + '' === classList) classList = classList.split(' ');
		if (classList instanceof Array) {
			classList.forEach(c => ele.classList.add(c));
		}
	}
	return ele;
};

const ShortcutsMap = {};
ShortcutsMap['Tab'] = 'TabIndent';
ShortcutsMap['shift+Tab'] = 'TabOutdent';
ShortcutsMap['ctrl+Tab'] = 'TabOutdent';
ShortcutsMap['ctrl+alt+Up'] = 'blockUp';
ShortcutsMap['ctrl+alt+Down'] = 'blockDown';
ShortcutsMap['ctrl+shift+Up'] = 'blockUp';
ShortcutsMap['ctrl+shift+Down'] = 'blockDown';
ShortcutsMap['ctrl+D'] = 'deleteLine';
ShortcutsMap['ctrl+Z'] = 'restoreManipulation';
ShortcutsMap['ctrl+Y'] = 'redoManipulation';

class MenuItem {
	name = '';
	icon = '';
	key = '';
	shortcut = '';
	ui;
	container;
	constructor (name, icon, key, shortcut) {
		shortcut = !!shortcut ? shortcut.trim() : '';
		if (!!shortcut) name = name + '（' + shortcut + '）'

		this.key = key || icon;
		this.name = name;
		this.icon = icon;
		this.shortcut = shortcut;
		this.ui = newEle('div', 'menu-item');
		this.ui.innerHTML = '<i class="fa fas far fab fa-' + icon + '"></i><span class="menu-item-hint">' + name + '</span>';
		this.ui.addEventListener('click', () => {
			if (!this.container) return;
			this.container.onClick(this.key, this);
		});
	}
	update (name, icon, key) {
		var btn = this.ui.querySelector('i.fa');
		btn.className = 'fa fas far fab fa-' + icon;
		this.ui.querySelector('span.menu-item-hint').innerHTML = name;
		this.key = key;
		this.name = name;
		this.icon = icon;
	}
	getShortcuts () {
		var sc = {};
		if (!!this.shortcut) sc[this.shortcut] = this.key;
		return sc;
	}
}
class MenuLine extends MenuItem {
	constructor () {
		super();
		this.ui = newEle('div', 'menu-break-line');
	}
}
class MenuGroup {
	items = [];
	name = '';
	icon = '';
	key = '';
	btn;
	group;
	ui;
	container;
	constructor () {
		this.btn = new MenuItem('', '', '');
		this.btn.container = this;
		this.group = newEle('div', 'menu-group-area');
		this.ui = newEle('div', 'menu-group');
		this.ui.appendChild(this.btn.ui);
		this.ui.appendChild(this.group);
	}
	add (name, icon, key, shortcut) {
		if (name instanceof MenuItem) {
			name.container = this;
			this.items.push(name);
			this.group.appendChild(name.ui);
		}
		else if (name instanceof MenuGroup) {
			name.ui.classList.add('menu-subgroup');
			name.container = this;
			this.items.push(name);
			this.group.appendChild(name.ui);
		}
		else {
			let btn = new MenuItem(name, icon, key, shortcut);
			btn.container = this;
			this.items.push(btn);
			this.group.appendChild(btn.ui);
		}

		if (this.items.length === 1) {
			let btn = this.items[0];
			this.btn.update(btn.name, btn.icon, btn.key);
			this.name = btn.name;
			this.icon = btn.icon;
			this.key = btn.key;
		}
	}
	onClick (key, btn) {
		this.btn.update(btn.name, btn.icon, btn.key);
		this.name = btn.name;
		this.icon = btn.icon;
		this.key = btn.key;
		if (!this.container) return;
		this.container.onClick(key, btn);
	}
	getShortcuts () {
		var list = {};
		this.items.forEach(item => {
			item = item.getShortcuts();
			Object.keys(item).forEach(key => {
				if (!!key) list[key] = item[key]
			});
		});
		return list;
	}
}
class MenuBar {
	items = [];
	ui;
	hooker;
	constructor (hooker) {
		this.ui = newEle('div', 'menu-bar');
		this.hooker = hooker;
	}
	add (name, icon, key, shortcut) {
		if (name instanceof MenuItem) {
			name.ui.classList.add('top-level');
			this.items.push(name);
			this.ui.appendChild(name.ui);
			name.container = this;
		}
		else if (name instanceof MenuGroup) {
			this.items.push(name);
			this.ui.appendChild(name.ui);
			name.container = this;
		}
		else {
			let btn = new MenuItem(name, icon, key, shortcut);
			btn.ui.classList.add('top-level');
			this.items.push(btn);
			this.ui.appendChild(btn.ui);
			btn.container = this;
		}
	}
	onClick (key, btn) {
		if (!this.hooker) return;
		this.hooker(key);
	}
	getShortcuts () {
		var list = {};
		this.items.forEach(item => {
			item = item.getShortcuts();
			Object.keys(item).forEach(key => {
				if (!!key) list[key] = item[key]
			});
		});
		return list;
	}
}

class HistoryItem {
	content = '';
	start = -1;
	end = -1;
	scroll = 0
}
const HistoryManager = {
	history: [],
	index: -1,
	append: item => {
		HistoryManager.index ++;
		HistoryManager.history.splice(HistoryManager.index, HistoryManager.history.length);
		HistoryManager.history[HistoryManager.index] = item;
	},
	restore: () => {
		if (HistoryManager.index < 0) return null;
		HistoryManager.index --;
		return HistoryManager.history[HistoryManager.index];
	},
	redo: () => {
		if (HistoryManager.index === HistoryManager.history.length) return null;
		HistoryManager.index ++;
		return HistoryManager.history[HistoryManager.index];
	},
	clear: () => {
		HistoryManager.index = -1;
		HistoryManager.history = [];
	},
};

const ScrollSpeed = 50, ScrollRate = 0.15;

var fileCategory = 0, localFileName = '';
var changer, lastContent = '', articleConfig = {}, helpContent = '', isHelping = false;
var LaTeXMap = new Map(), contentMap = {};
const onEdited = async (saveHistory=true) => {
	if (!!changer) {
		clearTimeout(changer);
		changer = null;
	}
	var text = MUEditor.value;
	if (lastContent === text) return;
	var isFirst = lastContent === '';
	lastContent = text;
	MUScrollView.innerText = '';

	var last = MUPreview.innerHTML;
	var html;
	try {
		if (isHelping) {
			html = MarkUp.fullParse(text, { linenumber: true });
			articleConfig.lineCount = html.lineCount || 0;
			html = html.content;
		}
		else {
			articleConfig.linenumber = true;
			html = MarkUp.fullParse(text, articleConfig);
			articleConfig.lineCount = html.lineCount || 0;
			html = html.content;
		}
	} catch (err) {
		html = last;
		console.error(err);
	}

	MUPreview.innerHTML = html;

	var parsedList = [...MUPreview.querySelectorAll('span[name^="line"]')].map(ele => {
		ele = ele.parentElement;
		ele.__inner = ele.innerText.replace(/^[ 　\t\n\r]+|[ 　\t\n\r]+$/g, '');
		return ele;
	});
	contentMap = {};
	var lstIdx = 0, lstLen = parsedList.length;
	text.split('\n').forEach((line, lid) => {
		if (line.length === 0) return;
		if (!!line.match(/^[=\-\+\*~\._#]{3,}$/)) return;
		if (!!line.match(/^[ 　\t>\+\-\*`\^\|_~=\{\}<]$/)) return; //去除引用列表等中的空行
		if (!!line.match(/^[!@#]\[[^\(\)\[\]\{\}]*?(\[.*?\][ 　\t]*\(.*?\))*?[^\(\)\[\]\{\}]*?\](\([^\(\)\[\]\{\}]*?\))$/)) return; // 去除图片等资源
		if (!!line.match(/^\[([\w \-\.\+\=\\\/]+?)\] *[:：] *([\w\W]+?)$/)) return; // 去除图片等资源
		line = line.replace(/^[ 　\t>\+\-\*`\^\|_~=\{\}<]+/g, '');
		line = line.replace(/\\/g, '\\').replace(/\//g, '\/')
			.replace(/\*/g, '*').replace(/\-/g, '-').replace(/\+/g, '+').replace(/\~/g, '~')
			.replace(/\^/g, '^').replace(/\$/g, '$').replace(/\[/g, '[').replace(/\]/g, ']')
			.replace(/\{/g, '{').replace(/\}/g, '}').replace(/\(/g, '(').replace(/\)/g, ')')
			.replace(/\#/g, '#');
		line = line.split(/[\+\-\*~>!@#\^\$\{\}\(\)\[\]]/)[0];
		var idx = -1;
		for (let i = lstIdx; i < lstLen; i ++) {
			let l = parsedList[i];
			if (l.__inner.indexOf(line) === 0) {
				idx = i;
				lstIdx = idx + 1;
				break;
			}
		}
		contentMap[lid] = parsedList[idx];
	});

	articleConfig.lineMap = [];
	articleConfig.lineWordCount = 0;
	if (articleConfig.lineCount > 0) {
		for (let i = 0; i < articleConfig.lineCount; i ++) {
			var mark = MUPreview.querySelector('span[name="line-' + i + '"]');
			if (!mark) {
				articleConfig.lineMap.push([i, 0]);
				continue;
			}
			mark = mark.parentElement;
			var count = mark.innerText.length;
			articleConfig.lineWordCount += count;
			articleConfig.lineMap.push([i, count]);
		}
	}

	// 获得 LaTeX 列表
	var needRedraw = false;
	MUPreview.querySelectorAll('.latex').forEach(latex => {
		var inner = latex.innerText;
		var output = LaTeXMap.get(inner);
		latex.__latex = inner;
		if (!!output) latex.innerHTML = '';
		else needRedraw = true;
	});

	if (needRedraw) {
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		// 缓存渲染完成的 LaTeX
		MathJax.Hub.Queue((...args) => {
			MUPreview.querySelectorAll('.latex').forEach(latex => {
				var origin = latex.__latex;
				var output = LaTeXMap.get(origin);

				if (!!output) {
					latex.innerHTML = output;
				}
				else {
					output = latex.innerHTML;
					LaTeXMap.set(origin, output);
				}
			});
		});
	}
	else {
		MUPreview.querySelectorAll('.latex').forEach(latex => {
			var origin = latex.__latex;
			var output = LaTeXMap.get(origin);

			if (!!output) {
				latex.innerHTML = output;
			}
			else {
				output = latex.innerHTML;
				LaTeXMap.set(origin, output);
			}
		});
	}
	MUScrollView.innerText = text;

	if (saveHistory) {
		let history = new HistoryItem();
		history.content = text;
		history.start = MUEditor.selectionStart;
		history.end = MUEditor.selectionEnd;
		history.scroll = MUEditor.scrollTop;
		HistoryManager.append(history);
	}

	await wait(50);

	text = MUEditor.value;
	text = text.replace(/[ 　\t\n\+\-\*_\.,\?!\^\[\]\(\)\{\}$#@%&=\|\\\/<>~，。《》？‘’“”；：:、【】{}（）—…￥·`]+/g, ' ').replace(/ {2,}/g, ' ');
	text = text.replace(/[a-z0-9]+/gi, 'X').replace(/ +/g, '');
	var wordCount = text.length;
	document.querySelector('div.controller.toolbar div.wordcount-hint span.count').innerText = wordCount;
};
const onChange = () => {
	if (!!changer) {
		clearTimeout(changer);
		changer = null;
	}
	changer = setTimeout(onEdited, 1000);
};
var scroller;
const scrollViewTo = to => {
	var curr = MUPreview.scrollTop;
	if (curr === to) return;
	var next;
	if (to > curr) {
		let delta = (to - curr) * ScrollRate;
		if (delta < ScrollSpeed) delta = ScrollSpeed;
		next = curr + delta;
		if (next > to) next = to;
	}
	else {
		let delta = (curr - to) * ScrollRate;
		if (delta < ScrollSpeed) delta = ScrollSpeed;
		next = curr - delta;
		if (next < to) next = to;
	}
	MUPreview.scrollTo(0, next);
	if (next !== to) {
		scroller = setTimeout(() => scrollViewTo(to), 50);
	}
};
var mover;
const onMoved = () => {
	if (!!mover) {
		clearTimeout(mover);
		mover = null;
	}
	if (!!scroller) {
		clearTimeout(scroller);
		scroller = null;
	}

	MUScrollView.scrollTop = MUEditor.scrollTop;

	if (!articleConfig.lineCount || articleConfig.lineCount === 0) {
		let percent = MUEditor.scrollTop / (MUEditor.scrollHeight - MUEditor.offsetHeight);
		let height = MUPreview.scrollHeight - MUPreview.offsetHeight;
		height *= percent;
		scrollViewTo(Math.floor(height));
	}
	else {
		let percent = MUEditor.scrollTop / (MUEditor.scrollHeight - MUEditor.offsetHeight);
		let target = MUEditor.offsetHeight * percent;
		let index = -1;
		let content = MUScrollView.innerText.split('\n');
		[...MUScrollView.querySelectorAll('br')].some((ele, lid) => {
			var {top} = ele.getBoundingClientRect();
			if (top > target) return true;
			index = lid;
		});
		target = null;
		for (let i = index; i >= 0; i --) {
			let e = contentMap[i];
			if (!!e) {
				target = e;
				break;
			}
		}

		if (!target) {
			let pos = Math.round(articleConfig.lineWordCount * percent);
			let count = 0;
			index = 0;
			articleConfig.lineMap.some(line => {
				count += line[1];
				index = line[0];
				return count >= pos;
			});
			target = MUPreview.querySelector('span[name="line-' + index + '"]');
			if (!!target) target = target.parentElement;
		}
		if (!target) {
			let height = MUPreview.scrollHeight - MUPreview.offsetHeight;
			height *= percent;
			scrollViewTo(Math.floor(height));
		}
		else {
			let {top, height} = target.getBoundingClientRect();
			top -= 200;

			let position = top + MUPreview.scrollTop + (height - MUPreview.offsetHeight + 150) * percent;
			scrollViewTo(Math.floor(position));
		}
	}
};
const onWheel = () => {
	if (!!mover) {
		clearTimeout(mover);
		mover = null;
	}
	mover = setTimeout(onMoved, 100);
};

const num2time = num => {
	var time = new Date(num);
	var Y = (time.getYear() + 1900) + '';
	var M = (time.getMonth() + 1) + '';
	var D = time.getDate() + '';
	var h = time.getHours() + '';
	var m = time.getMinutes() + '';
	var s = time.getSeconds() + '';

	if (M.length < 2) M = '0' + M;
	if (D.length < 2) D = '0' + D;
	if (h.length < 1) h = '00';
	else if (h.length < 2) h = '0' + h;
	if (m.length < 1) m = '00';
	else if (m.length < 2) m = '0' + m;
	if (s.length < 1) s = '00';
	else if (s.length < 2) s = '0' + s;
	return Y + '/' + M + '/' + D + ' ' + h + ':' + m + ':' + s;
};

const ContentController = {
	ui: MUEditor,
	text: '',
	start: -1,
	startLine: -1,
	startPos: -1,
	end: -1,
	endLine: -1,
	endPos: -1,
	lineCount: 0,
	charCount: 0,
	contents: [],
	didCross: false,
	update: () => {
		var text = ContentController.ui.value;
		var start = ContentController.ui.selectionStart;
		var end = ContentController.ui.selectionEnd;

		ContentController.text = text;
		ContentController.start = start;
		ContentController.end = end;
		ContentController.contents = ContentController.text.split('\n');

		var [lid, wid] = ContentController.getCoor(start);
		ContentController.startLine = lid;
		ContentController.startPos = wid;
		[lid, wid] = ContentController.getCoor(end);
		ContentController.endLine = lid;
		ContentController.endPos = wid;
		ContentController.didCross = ContentController.startLine !== ContentController.endLine;

		ContentController.lineCount = ContentController.contents.length;
		ContentController.charCount = ContentController.text.length;
	},
	restore: (start, end) => {
		ContentController.start = start;
		ContentController.end = end;
		ContentController.text = ContentController.contents.join('\n');
		ContentController.ui.value = ContentController.text;
		ContentController.ui.selectionStart = start;
		ContentController.ui.selectionEnd = end;
	},
	getPos: (lineID, charID) => {
		var result = 0;
		for (let i = 0; i < lineID; i ++) {
			let line = ContentController.contents[i] || '';
			result += line.length + 1;
		}
		result += charID;
		return result;
	},
	getCoor: pos => {
		var part = ContentController.text.substring(0, pos);
		part = part.match(/\n/g);
		if (!part) {
			return [0, pos];
		}
		else {
			let lid = part.length;
			let pre = ContentController.getPos(lid, 0);
			let cid = pos - pre;
			return [lid, cid];
		}
	},
	getSurrounding: (prefix='', pstfix='') => {
		if (ContentController.didCross) return null;

		pstfix = pstfix || prefix;
		var preLen = prefix.length;
		var pstLen = pstfix.length;

		var text = ContentController.text;
		var start = ContentController.start;
		var end = ContentController.end;
		var selLen = end - start;

		var lineID = ContentController.startLine;
		var startPos = ContentController.startPos;
		var endPos = ContentController.endPos;
		var lineText = ContentController.contents[lineID];
		var lineLen = lineText.length;

		if (endPos < preLen || startPos > lineLen - pstLen) return [false, lineID, startPos, endPos];

		var pairStart, pairEnd;
		var newStart = -1, newEnd = -1;

		pairStart = startPos;
		if (selLen < preLen) {
			pairStart = endPos - preLen;
		}
		pairEnd = startPos - preLen;
		if (pairEnd < 0) pairEnd = 0;
		for (let i = pairStart; i >= pairEnd; i --) {
			let l = lineText.substr(i, preLen);
			if (l === prefix) {
				newStart = i;
				break;
			}
		}

		pairStart = endPos - pstLen;
		if (selLen < pstLen) {
			pairStart = startPos;
		}
		pairEnd = endPos;
		if (endPos + pstLen > lineLen) pairEnd = lineLen - pstLen;
		for (let i = pairStart; i <= pairEnd; i ++) {
			let l = lineText.substr(i, pstLen);
			if (l === pstfix) {
				newEnd = i;
				break;
			}
		}

		if (newStart < 0 && newEnd < 0) return [false, lineID, startPos, endPos];

		var found = false;
		if (newStart < 0) {
			newStart = startPos;
		}
		else if (newEnd < 0) {
			newEnd = endPos;
			newStart += preLen;
		}
		else {
			newEnd += pstLen;
			found = true;
		}

		return [found, lineID, newStart, newEnd];
	},
};

const togglePair = (prefix='', pstfix) => {
	pstfix = pstfix || prefix;

	var info = ContentController.getSurrounding(prefix, pstfix);
	if (!info) return false;

	var [found, lid, start, end] = info;
	var lineText = ContentController.contents[lid];
	var firstPart = lineText.substring(0, start);
	var lastPart = lineText.substring(end, lineText.length);
	var innerPart = lineText.substring(start, end);

	if (found) {
		innerPart = innerPart.substring(prefix.length, innerPart.length - pstfix.length);
	}
	else {
		innerPart = prefix + innerPart + pstfix;
	}
	ContentController.contents[lid] = firstPart + innerPart + lastPart;
	end = start + innerPart.length;
	start = ContentController.getPos(lid, start);
	end = ContentController.getPos(lid, end);
	ContentController.restore(start, end);
	return true;
};
const sizeUp = () => {
	if (ContentController.didCross) return false;

	var start = ContentController.startPos;
	var end = ContentController.endPos;
	if (start === end) return false;

	var tag = '^^^^^', found = false, lid = -1;
	while (true) {
		let info = ContentController.getSurrounding(tag);
		if (!!info && info[0]) {
			[found, lid, start, end] = info;
			break;
		}
		if (tag.length === 2) break;
		tag = tag.substring(1, tag.length);
	}
	if (found && tag.length === 5) return;

	if (lid < 0) lid = ContentController.startLine;
	var lineText = ContentController.contents[lid];
	var firstPart = lineText.substring(0, start);
	var lastPart = lineText.substring(end, lineText.length);
	var innerPart = lineText.substring(start, end);

	innerPart = '^' + innerPart + '^';
	if (!found) innerPart = '^' + innerPart + '^';
	ContentController.contents[lid] = firstPart + innerPart + lastPart;
	end = start + innerPart.length;
	start = ContentController.getPos(lid, start);
	end = ContentController.getPos(lid, end);
	ContentController.restore(start, end);
	return true;
};
const sizeDown = () => {
	if (ContentController.didCross) return false;

	var start = ContentController.startPos;
	var end = ContentController.endPos;
	if (start === end) return false;

	var tag = '^^^^^', found = false, lid = -1;
	while (true) {
		let info = ContentController.getSurrounding(tag);
		if (!!info && info[0]) {
			[found, lid, start, end] = info;
			break;
		}
		if (tag.length === 2) break;
		tag = tag.substring(1, tag.length);
	}
	if (!found) return;
	if (tag.length === 2) found = false;

	if (lid < 0) lid = ContentController.startLine;
	var lineText = ContentController.contents[lid];
	var firstPart = lineText.substring(0, start);
	var lastPart = lineText.substring(end, lineText.length);
	var innerPart = lineText.substring(start, end);

	innerPart = innerPart.substring(1, innerPart.length - 1);
	if (!found) innerPart = innerPart.substring(1, innerPart.length - 1);
	ContentController.contents[lid] = firstPart + innerPart + lastPart;
	end = start + innerPart.length;
	start = ContentController.getPos(lid, start);
	end = ContentController.getPos(lid, end);
	ContentController.restore(start, end);
	return true;
};
const headerUp = (lineID) => {
	var lineText = ContentController.contents[lineID];
	var level = lineText.match(/^#+/);
	level = !!level ? level.length : 0;
	if (!lineText.match(/^[ 　\t#]/)) lineText = ' ' + lineText;
	lineText = '#' + lineText;
	ContentController.contents[lineID] = lineText;
	return true;
};
const toggleHeaderHandler = (lineID, level) => {
	var lineText = ContentController.contents[lineID];
	var header = lineText.match(/^(#+)[ 　\t]+/);
	var prefix = '';
	for (let i = 0; i < level; i ++) prefix = prefix + '#';
	if (!header) {
		if (!lineText.match(/^[ 　\t#]/)) lineText = ' ' + lineText;
		lineText = prefix + lineText;
	}
	else {
		lineText = lineText.replace(header[0], '');
		if (header[1].length !== level) {
			lineText = prefix + ' ' + lineText;
		}
	}
	ContentController.contents[lineID] = lineText;
	return true;
};
const toggleHeader = (level, fromKB=false) => {
	var changed = false;
	for (let i = ContentController.startLine; i <= ContentController.endLine; i ++) {
		let c;
		if (fromKB) c = headerUp(i);
		else c = toggleHeaderHandler(i, level);
		if (c) changed = true;
	}

	var start = ContentController.getPos(ContentController.startLine, 0);
	var end = ContentController.getPos(ContentController.endLine + 1, 0) - 1;
	ContentController.restore(start, end);

	return changed;
};
const doMoveLevel = (isLevIn, lineID, doHeader=false) => {
	var lineText = ContentController.contents[lineID];
	if (!lineText || lineText.length === 0) return false;

	var head = lineText.match(/^( {4}|　{2}|\t[ 　]*|#[ 　\t]*|\+[ 　\t]*|\-[ 　\t]*|\*[ 　\t]*|~[ 　\t]*|>[ 　\t]*|\d+\.[ 　\t]*)/);
	if (!head) {
		if (isLevIn) lineText = '\t' + lineText;
	}
	else if (isLevIn) {
		lineText = "\t" + lineText;
	}
	else {
		lineText = lineText.replace(head[0], '');
	}

	ContentController.contents[lineID] = lineText;
	return true;
};
const moveLevel = (isLevIn, doHeader=false) => {
	var changed = false;
	for (let i = ContentController.startLine; i <= ContentController.endLine; i ++) {
		let c = doMoveLevel(isLevIn, i, doHeader);
		if (c) changed = true;
	}
	if (!changed) return false;

	var start = ContentController.getPos(ContentController.startLine, 0);
	var end = ContentController.getPos(ContentController.endLine + 1, 0) - 1;
	ContentController.restore(start, end);
	return changed;
};
const moveBlock = (isUp=true) => {
	var startLine = ContentController.startLine;
	var endLine = ContentController.endLine;

	if (isUp && startLine === 0) return false;
	if (!isUp && endLine === ContentController.lineCount - 1) return false;

	var target = isUp ? startLine - 1 : endLine + 1;
	var content = ContentController.contents[target];

	if (isUp) {
		for (let i = startLine; i <= endLine; i ++) {
			ContentController.contents[i - 1] = ContentController.contents[i];
		}
		ContentController.contents[endLine] = content;
		startLine --;
		endLine --;
	}
	else {
		for (let i = endLine; i >= startLine; i --) {
			ContentController.contents[i + 1] = ContentController.contents[i];
		}
		ContentController.contents[startLine] = content;
		startLine ++;
		endLine ++;
	}

	var start = ContentController.getPos(startLine, 0);
	var end = ContentController.getPos(endLine + 1, 0) - 1;
	ContentController.restore(start, end);
	return true;
};
const togglePara = (tag, param) => {
	var startLine = ContentController.startLine;
	var startPos = ContentController.startPos;
	var endLine = ContentController.endLine;
	var endPos = ContentController.endPos;
	var lineLen = ContentController.contents[startLine].length;
	var start, end;
	var prefix = tag + '\t';
	if (!!param) prefix = prefix + '[' + param + '] ';

	if (startLine !== endLine || startPos !== endPos || lineLen === 0 || lineLen !== startPos) {
		for (let i = startLine; i <= endLine; i ++) {
			ContentController.contents[i] = prefix + ContentController.contents[i];
		}
		start = ContentController.getPos(startLine, 0);
		end = ContentController.getPos(endLine + 1, 0) - 1;
	}
	else {
		let next = ContentController.contents[startLine + 1];
		if (next.length > 0) {
			ContentController.contents.splice(startLine + 1, 0, '');
		}
		ContentController.contents.splice(startLine + 1, 0, prefix);
		startLine ++;
		startPos = prefix.length;
		start = ContentController.getPos(startLine, startPos);
		end = start;
	}

	ContentController.restore(start, end);
	return true;
};
const deleteLine = () => {
	var lineID = ContentController.startLine;
	if (ContentController.lineCount === 0) {
		ContentController.contents.push('');
		lineID = 0;
	}
	else if (ContentController.lineCount === 1) {
		ContentController.contents[0] = '';
	}
	else {
		ContentController.contents.splice(lineID, ContentController.endLine - lineID + 1);
	}

	var pos = ContentController.getPos(lineID, 0);
	ContentController.restore(pos, pos);
	return true;
};
const generateTable = async () => {
	var inner = '<div class="table-generator">';
	inner += '<div class="table-line">行：<input class="number-inputter row-count" type="number" value=2></div>';
	inner += '<div class="table-line">列：<input class="number-inputter col-count" type="number" value=2></div>';
	inner += '<div class="table-line button-line"><button class="confirm">确定</button></div>';
	inner += '</div>';

	Alert.show(inner, '插入表格', () => {
		MUEditor.focus();
	});

	var callback = () => {
		alert.querySelector('button').removeEventListener('click', callback);
		var row = alert.querySelector('input.row-count').value * 1;
		var col = alert.querySelector('input.col-count').value * 1;
		createTable(row, col);
		Alert.close();
		callback = null;
		alert = null;
	};

	await wait(100);

	var alert = document.querySelector('#alertFrame');
	alert.querySelector('input.row-count').focus();
	alert.querySelector('button').addEventListener('click', callback);
};
const createTable = (row, col) => {
	if (row <= 0 || col <= 0) return;

	var endLine = ContentController.endLine;
	var isEmpty = ContentController.contents[endLine].length === 0;

	var next = ContentController.contents[endLine + 1];
	if (next.length > 0) {
		ContentController.contents.splice(endLine + 1, 0, '');
	}

	var header = '|', cfg = '|', blank = '|';
	for (let i = 0; i < col; i ++) {
		header = header + ('标题' + (i + 1)) + '|';
		cfg = cfg + '-----|';
		blank = blank + '     |';
	}
	for (let i = 0; i < row; i ++) ContentController.contents.splice(endLine + 1, 0, blank);
	ContentController.contents.splice(endLine + 1, 0, cfg);
	if (isEmpty) {
		ContentController.contents[endLine] = header;
	}
	else {
		ContentController.contents.splice(endLine + 1, 0, header);
		ContentController.contents.splice(endLine + 1, 0, '');
		endLine += 2;
	}

	var start = ContentController.getPos(endLine, 0);
	var end = start;
	ContentController.restore(start, end);

	onEdited();
};
const generateMark = async (title, key) => {
	var sel = '';
	if (!ContentController.didCross) {
		sel = ContentController.contents[ContentController.startLine].substring(ContentController.startPos, ContentController.endPos);
	}

	var inner = '<div class="table-generator">';
	inner += '<div class="table-line">名称：<input class="number-inputter mark-title" value="' + sel.replace(/"/g, '\\"') + '"></div>';
	inner += '<div class="table-line">标记：<input class="number-inputter mark-name" value=""></div>';
	inner += '<div class="table-line button-line"><button class="confirm">确定</button></div>';
	inner += '</div>';

	Alert.show(inner, '插入' + title, () => {
		MUEditor.focus();
	});

	var callback = () => {
		alert.querySelector('button').removeEventListener('click', callback);
		var title = alert.querySelector('input.mark-title').value;
		var name = alert.querySelector('input.mark-name').value;
		createMark(key, title, name);
		Alert.close();
		callback = null;
		alert = null;
	};

	await wait(100);

	var alert = document.querySelector('#alertFrame');
	alert.querySelector('input.mark-title').focus();
	alert.querySelector('button').addEventListener('click', callback);
};
const createMark = (key, title, name) => {
	if (name.length === 0) return;

	var endLine = ContentController.endLine;
	var endPos = ContentController.endPos;
	var startLine = ContentController.didCross ? endLine : ContentController.startLine;
	var startPos = ContentController.didCross ? endPos : ContentController.startPos;
	var lineText = ContentController.contents[startLine];
	var firstPart = lineText.substring(0, startPos);
	var lastPart = lineText.substring(endPos, lineText.length);
	
	var inner = '[' + title + ']';
	if (key === 'footnote') {
		if (title.length === 0) inner = '';
		inner += '[:' + name + ']';
	}
	else if (key === 'endnote') {
		if (title.length === 0) inner = '';
		inner += '[^' + name + ']';
	}
	else {
		if (title.length === 0) return;
		inner += '{' + name + '}';
	}
	lineText = firstPart + inner + lastPart;
	ContentController.contents[startLine] = lineText;

	if (key !== 'anchor') {
		let next = ContentController.contents[startLine + 1];
		if (next.length > 0) {
			ContentController.contents.splice(startLine + 1, 0, '');
		}
		let tag = '[' + name + ']: ';
		startPos = tag.length;
		tag += title;
		ContentController.contents.splice(startLine + 1, 0, tag);
		ContentController.contents.splice(startLine + 1, 0, '');
		startLine += 2;
		endLine = startLine;
		endPos = startPos + title.length;
	}
	else {
		startPos = firstPart.length;
		endPos = startPos + inner.length;
	}

	var start = ContentController.getPos(startLine, startPos);
	var end = ContentController.getPos(endLine, endPos);
	ContentController.restore(start, end);

	onEdited();
};
const generateIcon = async () => {
	var sel = '';
	var inner = ContentController.contents[ContentController.startLine];
	if (!ContentController.didCross) {
		sel = inner.substring(ContentController.startPos, ContentController.endPos);
	}
	else {
		let info = ContentController.getSurrounding(':');
		sel = inner.substring(info[2], info[3]);
	}
	if (sel.length > 0) {
		let head = sel.match(/^:([\w\-\.]+):$/);
		if (!!head) sel = head[1];
	}

	inner = '<div class="icon-generator">';
	inner += '<div class="icon-line">图标名：<input class="number-inputter icon-name" value="' + sel.replace(/"/g, '\\"') + '"></div>';
	inner += '<div class="icon-line button-line"><button class="confirm">确定</button></div>';
	inner += '</div>';

	Alert.show(inner, '插入图标', () => {
		MUEditor.focus();
	});

	var callback = () => {
		alert.querySelector('button').removeEventListener('click', callback);
		var name = alert.querySelector('input.icon-name').value;
		createIcon(name);
		Alert.close();
		callback = null;
		alert = null;
	};

	await wait(100);

	var alert = document.querySelector('#alertFrame');
	alert.querySelector('input.icon-name').focus();
	alert.querySelector('button').addEventListener('click', callback);
};
const createIcon = (name) => {
	if (name.length === 0) return;

	var endLine = ContentController.endLine;
	var endPos = ContentController.endPos;
	var startLine = ContentController.didCross ? endLine : ContentController.startLine;
	var startPos = ContentController.didCross ? endPos : ContentController.startPos;
	if (startPos !== endPos) {
		let info = ContentController.getSurrounding(':');
		startPos = info[2];
		endPos = info[3];
	}

	var lineText = ContentController.contents[startLine];
	var firstPart = lineText.substring(0, startPos);
	var lastPart = lineText.substring(endPos, lineText.length);
	var inner = ':' + name + ':';
	lineText = firstPart + inner + lastPart;
	ContentController.contents[startLine] = lineText;

	var start = ContentController.getPos(startLine, startPos);
	var end = ContentController.getPos(endLine, endPos);
	ContentController.restore(start, end);

	onEdited();
};
const generateLink = async (title, type) => {
	var sel = '', link = '';
	if (!ContentController.didCross) {
		sel = ContentController.contents[ContentController.startLine].substring(ContentController.startPos, ContentController.endPos);
	}

	if (sel.length > 0) {
		let head = sel.match(/\[([\w\W]*?)\][ 　]*\(([\w\W]+?)\)/);
		if (!!head) {
			sel = head[1];
			link = head[2];
		}
	}

	var inner = '<div class="link-generator">';
	inner += '<div class="link-line">名称：<input class="number-inputter link-title" value="' + sel.replace(/"/g, '\\"') + '"></div>';
	inner += '<div class="link-line">地址：<input class="number-inputter link-address" value="' + link.replace(/"/g, '\\"') + '"></div>';
	if (type !== 'link') {
		inner += '<div class="link-line button-line">';
		inner += '<input type="radio" name="location" value="nextline" checked><span class="name">独立一行</span><br>';
		inner += '<input type="radio" name="location" value="floatleft"><span class="name">左侧混排</span><br>';
		inner += '<input type="radio" name="location" value="floatright"><span class="name">右侧混排</span>';
		inner += '</div>';
	}
	inner += '<div class="link-line button-line"><button class="confirm">确定</button></div>';
	inner += '</div>';

	Alert.show(inner, '插入' + title, () => {
		MUEditor.focus();
	});

	var callback = () => {
		alert.querySelector('button').removeEventListener('click', callback);
		var title = alert.querySelector('input.link-title').value;
		var name = alert.querySelector('input.link-address').value;
		var location;
		if (type !== 'link') {
			var locs = alert.querySelectorAll('input[name="location"]');
			locs.forEach(r => {
				if (r.checked) location = r.value;
			});
		}
		createLink(type, title, name, location);
		Alert.close();
		callback = null;
		alert = null;
	};

	await wait(100);

	var alert = document.querySelector('#alertFrame');
	alert.querySelector('input.link-title').focus();
	alert.querySelector('button').addEventListener('click', callback);
};
const createLink = (type, title, link, location) => {
	if (link.length === 0) return;

	var endLine = ContentController.endLine;
	var endPos = ContentController.endPos;
	var startLine = ContentController.didCross ? endLine : ContentController.startLine;
	var startPos = ContentController.didCross ? endPos : ContentController.startPos;
	var lineText = ContentController.contents[startLine];
	var firstPart = lineText.substring(0, startPos);
	var lastPart = lineText.substring(endPos, lineText.length);
	var inner;
	if (type === 'image') inner = '![';
	else if (type === 'video') inner = '@[';
	else if (type === 'audio') inner = '#[';
	else inner = '[';
	inner += title + '](' + link;
	if (location === 'floatleft') inner += ' "left")';
	else if (location === 'floatright') inner += ' "right")';
	else inner += ')';
	lineText = firstPart + inner + lastPart;
	ContentController.contents[startLine] = lineText;
	endPos = startPos + inner.length;

	var start = ContentController.getPos(startLine, startPos);
	var end = ContentController.getPos(endLine, endPos);
	ContentController.restore(start, end);

	onEdited();
};
const generateRefBlock = async () => {
	var inner = '<div class="table-generator">';
	inner += '<div class="table-line">名称：<input class="number-inputter block-name" value=""></div>';
	inner += '<div class="table-line button-line"><button class="confirm">确定</button></div>';
	inner += '</div>';

	Alert.show(inner, '插入引用块', () => {
		MUEditor.focus();
	});

	var callback = () => {
		alert.querySelector('button').removeEventListener('click', callback);
		var name = alert.querySelector('input.block-name').value;
		createRefBlock(name);
		Alert.close();
		callback = null;
		alert = null;
	};

	await wait(100);

	var alert = document.querySelector('#alertFrame');
	alert.querySelector('input.block-name').focus();
	alert.querySelector('button').addEventListener('click', callback);
};
const createRefBlock = (name) => {
	if (name.length === 0) return;

	var endLine = ContentController.endLine;
	var isEmpty = ContentController.contents[endLine].length === 0;

	var next = ContentController.contents[endLine + 1];
	if (next.length > 0) {
		ContentController.contents.splice(endLine + 1, 0, '');
	}

	var tag = '[:' + name + ':]';
	ContentController.contents.splice(endLine + 1, 0, tag);
	ContentController.contents.splice(endLine + 1, 0, '');

	if (isEmpty) {
		ContentController.contents.splice(endLine + 1, 0, tag);
		endLine += 1;
	}
	else {
		ContentController.contents.splice(endLine + 1, 0, tag);
		ContentController.contents.splice(endLine + 1, 0, '');
		endLine += 3;
	}

	var start = ContentController.getPos(endLine, 0);
	var end = start;
	ContentController.restore(start, end);

	onEdited();
};
const generateBlock = (tag) => {
	var endLine = ContentController.endLine;
	var isEmpty = ContentController.contents[endLine].length === 0;

	var next = ContentController.contents[endLine + 1];
	if (next.length > 0) {
		ContentController.contents.splice(endLine + 1, 0, '');
	}

	ContentController.contents.splice(endLine + 1, 0, tag);
	if (tag === '```') ContentController.contents.splice(endLine + 1, 0, 'printf("AlohaKosmos!")');
	else if (tag === '$$') ContentController.contents.splice(endLine + 1, 0, 'R_{\\mu\\nu} - \\frac{1}{2} R g_{\\mu\\nu} = G T_{\\mu\\nu}');
	else ContentController.contents.splice(endLine + 1, 0, '');
	if (isEmpty) {
		ContentController.contents[endLine] = tag;
		endLine += 1;
	}
	else {
		ContentController.contents.splice(endLine + 1, 0, tag);
		ContentController.contents.splice(endLine + 1, 0, '');
		endLine += 3;
	}

	var start = ContentController.getPos(endLine, 0);
	var end = start;
	ContentController.restore(start, end);
	return true;
};
const getBlockStart = (lineID) => {
	if (lineID === 0) return 0;
	var line = ContentController.contents[lineID];
	if (line.length === 0) return lineID;
	while (lineID > 0) {
		line = ContentController.contents[lineID - 1];
		if (line.length === 0) return lineID;
		if (!!line.match(/^[ 　\t]*([\+\-\*~>]+|\d+\.)/)) return lineID;
		lineID --;
	}
	return 0;
};
const getBlockEnd = (lineID) => {
	if (lineID === ContentController.lineCount - 1) return lineID;
	var line = ContentController.contents[lineID];
	if (line.length === 0) return lineID;
	while (lineID < ContentController.lineCount) {
		line = ContentController.contents[lineID + 1];
		if (line.length === 0) return lineID;
		if (!!line.match(/^[ 　\t]*([\+\-\*~>]+|\d+\.)/)) return lineID;
		lineID ++;
	}
	return ContentController.lineCount - 1;
};
const blockIndent = (isIn) => {
	var { startLine, endLine } = ContentController;
	startLine = getBlockStart(startLine);
	endLine = getBlockEnd(endLine);

	var changed = false, lastLine = '';
	for (let i = startLine; i <= endLine; i ++) {
		let line = ContentController.contents[i];
		if (line.length === 0) {
			lastLine = line;
			continue;
		}
		if (i > startLine) {
			let shouldGo = false;
			if (lastLine.length > 0) shouldGo = true;
			if (shouldGo) {
				if (!!line.match(/^[ 　\t]*([\+\-\*~>]+|\d+\.)/)) shouldGo = false;
			}
			if (shouldGo) {
				lastLine = line;
				continue;
			}
		}
		lastLine = line;
		let head = line.match(/^(( |　|\t|\-|\+|\*|>|~|\{[<\|>]\}|\d+\.)*)(:*)/);
		if (!head) {
			head = ["", "", ""];
		}
		let left = line.replace(head[0], '');
		if (isIn) {
			changed = true;
			line = head[0] + ':' + left;
		}
		else {
			let level = head[3].length;
			if (level === 0) {
				continue;
			}
			changed = true;
			let tag = '';
			for (let i = 1; i < level; i ++) tag += ':';
			line = head[1] + tag + left;
		}
		ContentController.contents[i] = line;
	}

	if (!changed) return false;

	var start = ContentController.getPos(startLine, 0);
	var end = ContentController.getPos(endLine + 1, 0) - 1;
	ContentController.restore(start, end);
	return true;
};
const blockAlign = (dir) => {
	var { startLine, endLine } = ContentController;
	startLine = getBlockStart(startLine);
	endLine = getBlockEnd(endLine);

	var blocks = [], bid = -1, line = '';
	for (let i = startLine; i <= endLine; i ++) {
		if (line.length === 0) {
			bid ++;
			blocks[bid] = [];
		}
		line = ContentController.contents[i];
		let head = line.match(/^[ 　\t]*([\+\-\*~>]+|\d+\.)/);
		if (!!head) {
			if (blocks[bid].length > 0) {
				bid ++;
				blocks[bid] = [];
			}
		}
		blocks[bid].push([i, line.length > 0]);
	}
	blocks.forEach((block, i) => {
		block = block.filter(line => line[1]).map(line => line[0]);
		blocks[i] = block;
	});
	blocks = blocks.filter(b => b.length > 0);

	blocks.forEach(block => {
		var lid = block[0];
		var line = ContentController.contents[lid];
		var head = line.match(/^(( |　|\t|\-|\+|>|\*|:|~|\d+\.)*)(\{[<\|>]\})/);
		if (!!head) {
			line = head[1] + line.replace(head[0], '');
		}
		ContentController.contents[lid] = line;

		lid = block[block.length - 1];
		line = ContentController.contents[lid];
		head = line.match(/(\{[<\|>]\})[ 　\t]*$/);
		if (!!head) {
			line = line.substring(0, line.length - head[0].length);
		}
		if (dir === 1) line += '{|}';
		else if (dir === 2) line += '{>}';
		ContentController.contents[lid] = line;
	});

	var start = ContentController.getPos(startLine, 0);
	var end = ContentController.getPos(endLine + 1, 0) - 1;
	ContentController.restore(start, end);
	return true;
};
const insertLine = (tag) => {
	var endLine = ContentController.endLine;
	var isEmpty = ContentController.contents[endLine].length === 0;

	var next = ContentController.contents[endLine + 1];
	if (next.length > 0) {
		ContentController.contents.splice(endLine + 1, 0, '');
	}

	if (isEmpty) {
		ContentController.contents[endLine] = tag;
	}
	else {
		ContentController.contents.splice(endLine + 1, 0, tag);
		ContentController.contents.splice(endLine + 1, 0, '');
	}

	var start = ContentController.start;
	var end = ContentController.end;
	ContentController.restore(start, end);
	return true;
};
const showHelp = () => {
	if (isHelping) return;
	isHelping = true;

	HistoryManager._index = HistoryManager.index;
	HistoryManager._history = HistoryManager.history;
	sessionStorage.content = MUEditor.value;
	HistoryManager.clear();
	MUEditor.value = helpContent;
	onEdited();
};
const download = (filename, content) => {
	var blob = new Blob([content], { type: 'text/plain' });
	var link = URL.createObjectURL(blob);
	var downloader = document.createElement('a');
	downloader.setAttribute('href', link);
	if (!!filename) downloader.setAttribute('download', filename);
	else downloader.setAttribute('download', 'untitled');
	downloader.click();
};
const downloadMU = () => {
	var filename = localFileName;
	if (!filename) {
		filename = MUPreview.querySelector('header.article-title').innerText + '.mu';
	}
	download(filename, MUEditor.value);
};
const downloadHTML = () => {
	var title = MUPreview.querySelector('header.article-title').innerText;
	var filename = localFileName;
	if (!filename) {
		filename = title + '.html';
	}
	else {
		filename = filename.replace(/\.mu$/i, '') + '.html';
	}

	var xhr = new XMLHttpRequest();
	xhr.open('get', './style/default.css', true);
	xhr.onreadystatechange = () => {
		if (xhr.readyState == 4) {
			if (xhr.status === 0 || xhr.response === '') return res(null);
			var text = xhr.responseText;
			text = 'body{background-color: rgb(22, 24, 35);}\narticle{line-height: 24px;font-size: 16px;font-family: Georgia,Times New Roman,Times,Songti SC,serif;color: rgb(225, 225, 225);}\n' + text;
			var html = '<html>\n<head>\n<meta charset="UTF-8">\n<title>' + title + '</title>\n<style>\n' + text + '\n</style>\n</head>\n';
			html += content + '\n</html>';
			download(filename, html);
		}
	};
	xhr.send();

	var content = MarkUp.parse(MUEditor.value, {
		title,
		fullexport: true,
		showtitle: true,
		showauthor: true,
		glossary: true,
		resources: true,
		toc: true,
	});
	content = '<body>\n' + content + '\n</body>';
};
const saveDoc = () => {
	var content = MUEditor.value;
	var fingerprint = SHA256.FingerPrint(content);

	if (fileCategory === 1) {
		chrome.runtime.sendMessage({
			event: 'ModifyArchieve',
			fingerprint: articleConfig.fingerprint,
			content,
		});
	}
	else {
		let article = { content, fingerprint };
		let info = MarkUp.fullParse(content);
		if (fileCategory === 2) article.id = articleConfig.id;
		else if (articleConfig.fingerprint === 'NewFile') article.id = SHA256(content);
		else article.id = articleConfig.fingerprint;
		article.title = info.title;
		article.author = info.meta.author || '';
		article.email = info.meta.email || '';
		article.description = info.meta.description;
		article.category = info.meta.keywords.filter(kw => kw.length > 0);
		article.update = info.date || Date.now();
		chrome.runtime.sendMessage({ event: 'SaveArticle', article });
	}
};
const openLocalFile = file => {
	localFileName = file.name;
	var reader = new FileReader();
	reader.onload = () => {
		MUEditor.value = reader.result;
		HistoryManager.clear();
		lastContent = '';
		articleConfig = {
			fingerprint: '',
			title: file.name,
			update: file.lastModifiedDate.getTime(),
			content: reader.result,
			usage: []
		};
		onEdited(false);
		return;
	};
	reader.readAsText(file);
};
const readFile = () => {
	var file = FileLoader.files[0];
	if (!file) return;
	fileCategory = 0;
	openLocalFile(file);
};
const saveToShelf = () => {
	if (fileCategory !== 1) return;
	var content = '\n' + MUEditor.value + '\n';
	var keywords = generateKeywords(content);
	keywords.unshift('存档')
	keywords = keywords.join('、');
	if (!content.match(/\n(DATE|更新)[:：][^\n]+/)) content = '更新：' + num2time(articleConfig.update) + '\n' + content;
	if (!content.match(/\n(KEYWORD|关键词)[:：][^\n]+/)) content = '关键词：' + keywords + '\n' + content;
	if (!content.match(/\n(AUTHOR|作者)[:：][^\n]+/)) content = '作者：LostAbaddon的插件\n' + content;
	if (!content.match(/\n(TITLE|标题)[:：][^\n]+/)) content = '标题：' + articleConfig.title + '\n' + content;
	content = content.replace(/^\n+|\n+$/g, '');
	if (articleConfig.usage.length > 0) {
		content = content + '\n\n# 文章源：\n';
		articleConfig.usage.forEach(usage => {
			content = content + '\n-\t' + usage;
		});
	}

	var fingerprint = SHA256.FingerPrint(content);
	var article = { content, fingerprint };
	var info = MarkUp.fullParse(content);
	article.title = articleConfig.title;
	article.description = '';
	article.category = info.meta.keywords.filter(kw => kw.length > 0);
	article.update = articleConfig.update;
	article.id = fingerprint;
	chrome.runtime.sendMessage({ event: 'SaveArticle', article });
};
const generateKeywords = content => {
	var wordFreq = {};
	content = content
		.replace(/\n+([ 　\t>\-\+\*]+|\d+\.[ 　\t>]*)+/g, '\n')
		.replace(/\n(#+[ 　\t]|`{3,}|\${2,})/g, '\n')
		.replace(/[\*~_`\$\-\^]+/g, '')
		.replace(/[!@#]\[([^\n]*?)\][ 　\t]*\([^\n]*?\)/g, (match, title) => ' ' + title + ' ')
		.replace(/[\t 　,\.\(\)\{\}\[\]\?<>\\\/\!`~@#\$%\^&\*\-=_\+，。《》？、；：‘“’”'":;【】（）…—·！￥]+/g, ' ')
		.replace(/ +/g, ' ')
		.replace(/[a-z0-9\-\_\. ]+/gi, match => {
			var words = match.trim().split(/ +/).filter(w => w.length > 0);
			var line = [];
			words.forEach(w => {
				line.push(w);
				var ws = line.join(' ');
				if (!!ws.match(/^[\d\. ]+$/)) return;
				wordFreq[ws] = (wordFreq[ws] || 0) + 1;
			});
			return '\n';
		})
		.split(/[ \n\r]+/)
		.filter(l => l.length > 0)
	;
	content.forEach(chars => {
		chars = chars.replace(/[ 　\t]+/g, '');
		var len = chars.length;
		if (len < 2) return;
		for (let i = 2; i <= 10; i ++) {
			for (let j = 0; j <= len - i; j ++) {
				let w = chars.substr(j, i);
				wordFreq[w] = (wordFreq[w] || 0) + 1;
			}
		}
	});

	var valueList = [];
	var wordList = Object.keys(wordFreq).map(w => {
		var v = w.replace(/[a-z0-9\-_\.]+/gi, 'X').replace(/ +/g, '');
		v = v.length;
		valueList[v] = (valueList[v] || 0) + 1;
		var f = wordFreq[w];
		var list = [], sep;
		if (!!w.match(/^[a-z0-9\-_\. ]+$/i)) {
			sep = ' ';
		}
		else {
			sep = '';
		}
		let lst = w.split(sep);
		let ll = lst.length - 1;
		for (let i = 0; i < ll; i ++) {
			let pre = [...lst].splice(0, i).join(sep);
			let pst = [...lst].splice(ll + 1 - i, i).join(sep);
			if (!list.includes(pre)) list.push(pre);
			if (!list.includes(pst)) list.push(pst);
		}
		var item = [w, f, v, f * Math.sqrt(v + 1), list];
		wordFreq[w] = item;
		return item;
	});
	wordList.sort((wa, wb) => wb[2] - wa[2]);
	wordList.forEach(item => {
		var list = item[4], value = item[3] * Math.sqrt(item[2]);
		list.forEach(w => {
			var wf = wordList[w];
			if (!wf) return;
			wf[3] -= value;
		});
	});
	wordList = wordList.filter(item => item[3] > 0);

	var count = 0, total = 0, len = wordList.length;
	for (let i = 0; i < len; i ++) {
		let j = wordList[i][3];
		let v = j;
		count += v;
		v *= j;
		total += v;
		wordList[i][4] = v;
	}
	for (let i = 0; i < len; i ++) {
		let v = wordList[i][4];
		v /= total;
		v = 0 - Math.log(v) * v;
		wordList[i][4] = v;
	}
	wordList.sort((wa, wb) => wb[3] - wa[3]);
	wordList = wordList.splice(0, 10);
	wordList = wordList.map(item => item[0]);
	return wordList;
};

const controlHandler = (key, fromKB=false) => {
	var result = false;
	var scroll = MUEditor.scrollTop;
	var saveHistory = true;
	ContentController.update();

	var content = MUEditor.value;
	if (lastContent !== content) {
		let history = new HistoryItem();
		history.content = content;
		history.start = MUEditor.selectionStart;
		history.end = MUEditor.selectionEnd;
		history.scroll = MUEditor.scrollTop;
		HistoryManager.append(history);
	}


	if (key === 'restoreManipulation') {
		saveHistory = false;

		let item = HistoryManager.restore();
		if (!!item) {
			MUEditor.value = item.content;
			MUEditor.selectionStart = item.start;
			MUEditor.selectionEnd = item.end;
			MUEditor.scrollTo(0, item.scroll);
			return true;
		}
		else {
			return false;
		}
	}
	else if (key === 'redoManipulation') {
		saveHistory = false;
		let item = HistoryManager.redo();
		if (!!item) {
			MUEditor.value = item.content;
			MUEditor.selectionStart = item.start;
			MUEditor.selectionEnd = item.end;
			MUEditor.scrollTo(0, item.scroll);
			return true;
		}
		else {
			return false;
		}
	}

	else if (key === 'TabIndent') {
		if (ContentController.didCross) {
			result = moveLevel(true, fromKB);
		}
		else {
			let lid = ContentController.startLine;
			let start = ContentController.startPos;
			let end = ContentController.endPos;

			let lineText = ContentController.contents[lid];
			let firstPart = lineText.substring(0, start);
			let lastPart = lineText.substring(end, lineText.length);
			ContentController.contents[lid] = firstPart + '\t' + lastPart;
			start ++;
			end = start;
			start = ContentController.getPos(lid, start);
			end = ContentController.getPos(lid, end);
			ContentController.restore(start, end);
			result = true;
		}
	}
	else if (key === 'TabOutdent') {
		result = moveLevel(false, fromKB);
	}

	else if (key === 'bold') {
		result = togglePair('**');
	}
	else if (key === 'italic') {
		result = togglePair('*');
	}
	else if (key === 'underline') {
		result = togglePair('__');
	}
	else if (key === 'wavy') {
		result = togglePair('~');
	}
	else if (key === 'delete') {
		result = togglePair('~~');
	}
	else if (key === 'sup') {
		result = togglePair('^');
	}
	else if (key === 'sub') {
		result = togglePair('_');
	}
	else if (key === 'sizeUp') {
		result = sizeUp();
	}
	else if (key === 'sizeDown') {
		result = sizeDown();
	}

	else if (key === 'red') {
		result = togglePair('[red]', '[/]');
	}
	else if (key === 'green') {
		result = togglePair('[green]', '[/]');
	}
	else if (key === 'blue') {
		result = togglePair('[blue]', '[/]');
	}
	else if (key === 'yellow') {
		result = togglePair('[yellow]', '[/]');
	}
	else if (key === 'gold') {
		result = togglePair('[gold]', '[/]');
	}
	else if (key === 'white') {
		result = togglePair('[white]', '[/]');
	}
	else if (key === 'silver') {
		result = togglePair('[silver]', '[/]');
	}
	else if (key === 'gray') {
		result = togglePair('[gray]', '[/]');
	}
	else if (key === 'dark') {
		result = togglePair('[dark]', '[/]');
	}
	else if (key === 'black') {
		result = togglePair('[black]', '[/]');
	}

	else if (key === 'insert-icon') {
		generateIcon();
		return false;
	}

	else if (key === 'heading-1') {
		result = toggleHeader(1, fromKB);
	}
	else if (key === 'heading-2') {
		result = toggleHeader(2, fromKB);
	}
	else if (key === 'heading-3') {
		result = toggleHeader(3, fromKB);
	}
	else if (key === 'heading-4') {
		result = toggleHeader(4, fromKB);
	}
	else if (key === 'heading-5') {
		result = toggleHeader(5, fromKB);
	}
	else if (key === 'heading-6') {
		result = toggleHeader(6, fromKB);
	}

	else if (key === 'quote-quote') {
		result = togglePara('>');
	}
	else if (key === 'quote-info') {
		result = togglePara('>', 'info');
	}
	else if (key === 'quote-success') {
		result = togglePara('>', 'success');
	}
	else if (key === 'quote-warning') {
		result = togglePara('>', 'warning');
	}
	else if (key === 'quote-danger') {
		result = togglePara('>', 'danger');
	}

	else if (key === 'list-ol') {
		result = togglePara('1.');
	}
	else if (key === 'list-ul') {
		result = togglePara('-');
	}

	else if (key === 'insert-table') {
		generateTable();
		result = false;
	}
	else if (key === 'insert-code') {
		result = generateBlock('```');
	}
	else if (key === 'insert-latex') {
		result = generateBlock('$$');
	}

	else if (key === 'convert-code') {
		result = togglePair('`');
	}
	else if (key === 'convert-latex') {
		result = togglePair('$');
	}
	else if (key === 'footnote') {
		generateMark('脚注', 'footnote');
		result = false;
	}
	else if (key === 'endnote') {
		generateMark('尾注', 'endnote');
		result = false;
	}
	else if (key === 'term') {
		generateMark('术语', 'term');
		result = false;
	}
	else if (key === 'anchor') {
		generateMark('锚点', 'anchor');
		result = false;
	}

	else if (key === 'levelOut') {
		result = moveLevel(false, fromKB);
	}
	else if (key === 'levelIn') {
		result = moveLevel(true, fromKB);
	}
	else if (key === 'blockUp') {
		result = moveBlock(true);
	}
	else if (key === 'blockDown') {
		result = moveBlock(false);
	}
	else if (key === 'indent') {
		result = blockIndent(true);
	}
	else if (key === 'outdent') {
		result = blockIndent(false);
	}
	else if (key === 'align-left') {
		result = blockAlign(0);
	}
	else if (key === 'align-center') {
		result = blockAlign(1);
	}
	else if (key === 'align-right') {
		result = blockAlign(2);
	}

	else if (key === 'insert-link') {
		generateLink('超链接', 'link');
		result = false;
	}
	else if (key === 'insert-image') {
		generateLink('图片', 'image');
		result = false;
	}
	else if (key === 'insert-video') {
		generateLink('视频', 'video');
		result = false;
	}
	else if (key === 'insert-audio') {
		generateLink('音频', 'audio');
		result = false;
	}

	else if (key === 'headline-normal') {
		result = insertLine('---');
	}
	else if (key === 'headline-double') {
		result = insertLine('===');
	}
	else if (key === 'headline-dotted') {
		result = insertLine('...');
	}
	else if (key === 'headline-dashed') {
		result = insertLine('___');
	}
	else if (key === 'headline-gradient') {
		result = insertLine('+++');
	}
	else if (key === 'headline-wavy') {
		result = insertLine('~~~');
	}
	else if (key === 'headline-star') {
		result = insertLine('***');
	}

	else if (key === 'insert-block') {
		generateRefBlock();
		result = false;
	}

	else if (key === 'help') {
		showHelp();
		return true;
	}
	else if (key === 'close') {
		if (isHelping) {
			isHelping = false;
			HistoryManager.clear();
			HistoryManager.index = HistoryManager._index;
			HistoryManager.history = HistoryManager._history;
			delete HistoryManager._index;
			delete HistoryManager._history;
			MUEditor.value = sessionStorage.content;
			onEdited();
			return true;
		}
		else if (fileCategory === 1) {
			let addr = location.origin + '/page/archieve.html?fingerprint=' + articleConfig.fingerprint;
			location.href = addr;
			return true;
		}
		else if (fileCategory === 2) {
			let addr = location.origin + '/library/view.html?id=' + articleConfig.id;
			location.href = addr;
			return true;
		}
		else {
			let addr = location.origin + '/library/index.html';
			location.href = addr;
			return true;
		}
	}
	else if (key === 'save-article') {
		saveDoc();
		return true;
	}
	else if (key === 'open-local-article') {
		FileLoader.accept = '.mu';
		// FileLoader.onchange = readFile;
		FileLoader.click();
		return true;
	}
	else if (key === 'download-mu') {
		downloadMU();
		return true;
	}
	else if (key === 'download-html') {
		downloadHTML();
		return true;
	}
	else if (key === 'saveToShelf') {
		saveToShelf();
		return true;
	}

	else if (key === 'deleteLine') {
		result = deleteLine();
	}

	MUEditor.focus();
	MUEditor.scrollTop = scroll;

	if (result) onEdited(saveHistory);

	return result;
};

const onKey = evt => {
	if (![16, 17, 18, 91].includes(evt.which)) {
		let keyPair = [];
		if (evt.ctrlKey) keyPair.push('ctrl');
		if (evt.altKey) keyPair.push('alt');
		if (evt.shiftKey) keyPair.push('shift');
		if (evt.winKey) keyPair.push('win');
		if (evt.metaKey) keyPair.push('meta');
		let keyName = evt.key;
		if (keyName.indexOf('Arrow') >= 0) keyName = keyName.replace('Arrow', '');
		else if (evt.which === 27) keyName = 'Esc';
		else if (evt.which === 8) keyName = 'Back';
		else if (evt.which === 9) keyName = 'Tab';
		else keyName = keyName.toUpperCase();
		keyPair.push(keyName);
		keyPair = keyPair.join('+');
		var shortcut = ShortcutsMap[keyPair];
		if (!shortcut) return;
		if (controlHandler(shortcut, true)) evt.preventDefault();
	}
};
const onDrop = evt => {
	var file = evt.dataTransfer;
	if (!file) return;
	file = file.files;
	if (!file) return;
	file = file[0];
	if (!file) return;
	openLocalFile(file);
	evt.preventDefault();
};
const onPaste = evt => {
	var content = evt.clipboardData.getData('text/html');
	var ele = newEle('div');
	ele.innerHTML = content;
	var result = MarkUp.reverse(ele);
	ele.innerHTML = '';
	ele = null;

	var content = MUEditor.value;
	var start = MUEditor.selectionStart;
	var end = MUEditor.selectionEnd;
	if (result.indexOf('\n') >= 0) {
		result = result.replace(/^\n+|\n+$/g, '');
		if (start > 0) result = '\n\n' + result;
		if (end < content.length) result = result + '\n\n';
	}

	var bra = content.substr(0, start);
	var ket = content.substr(end, content.length);
	content = bra + result + ket;
	MUEditor.value = content;
	evt.preventDefault();
};

MUEditor.addEventListener('keydown', onKey);
MUEditor.addEventListener('keyup', onChange);
MUEditor.addEventListener('paste', onPaste);
MUEditor.addEventListener('blur', onChange);
MUEditor.addEventListener('mousewheel', onWheel);
MUEditor.addEventListener('scroll', onWheel);
MUEditor.addEventListener('drop', onDrop);
MUPreview.addEventListener('drop', onDrop);
FileLoader.addEventListener('change', readFile);

chrome.runtime.onMessage.addListener(msg => {
	if (msg.event === "GetArticleByID") getArticleByID(msg.data);
});

const menuBar = new MenuBar(controlHandler);
const buildToolBar = (editorType=0) => {
	var group, subgroup;

	group = new MenuGroup();
	group.add('保存', 'save', 'save-article', 'ctrl+S');
	group.add('打开本地文档', 'file-word', 'open-local-article', 'ctrl+O');
	if (editorType === 1) group.add('转存到文库', 'copy', 'saveToShelf');
	group.add('下载 MU', 'file-download', 'download-mu');
	group.add('下载 HTML', 'file-export', 'download-html');
	menuBar.add(group);

	menuBar.add(new MenuLine());

	group = new MenuGroup();
	group.add('加粗', 'bold', 'bold', 'ctrl+B');
	group.add('斜体', 'italic', 'italic', 'ctrl+I');
	group.add('下划线', 'underline', 'underline', 'alt+U');
	group.add('波浪线', 'water', 'wavy', 'alt+W');
	group.add('删除线', 'strikethrough', 'delete', 'alt+D');
	group.add(new MenuLine());
	subgroup = new MenuGroup();
	subgroup.add('红色', 'color red', 'red');
	subgroup.add('绿色', 'color green', 'green');
	subgroup.add('蓝色', 'color blue', 'blue');
	subgroup.add('黄色', 'color yellow', 'yellow');
	subgroup.add('金色', 'color gold', 'gold');
	subgroup.add('白色', 'color white', 'white');
	subgroup.add('银色', 'color silver', 'silver');
	subgroup.add('灰色', 'color gray', 'gray');
	subgroup.add('深色', 'color dark', 'dark');
	subgroup.add('黑色', 'color black', 'black');
	group.add(subgroup);
	group.add(new MenuLine());
	group.add('上标', 'superscript', 'sup', 'alt+P');
	group.add('下标', 'subscript', 'sub', 'alt+B');
	group.add(new MenuLine());
	group.add('大一号', 'sort-amount-up', 'sizeUp', 'ctrl+Up');
	group.add('小一号', 'sort-amount-down', 'sizeDown', 'ctrl+Down');
	menuBar.add(group);

	group = new MenuGroup();
	group.add('脚注', 'paragraph', 'footnote', 'alt+F');
	group.add('尾注', 'scroll', 'endnote', 'alt+E');
	group.add('术语', 'pen-nib', 'term', 'alt+T');
	group.add('锚点', 'map-pin', 'anchor', 'alt+A');
	group.add(new MenuLine());
	group.add('代码', 'code', 'convert-code', 'alt+C');
	group.add('公式', 'square-root-alt', 'convert-latex', 'alt+L');
	group.add(new MenuLine());
	group.add('插入图标', 'flag', 'insert-icon');
	menuBar.add(group);

	menuBar.add(new MenuLine());

	group = new MenuGroup();
	subgroup = new MenuGroup();
	subgroup.add('一级标题', 'heading one', 'heading-1', 'alt+H');
	subgroup.add('二级标题', 'heading two', 'heading-2');
	subgroup.add('三级标题', 'heading three', 'heading-3');
	subgroup.add('四级标题', 'heading four', 'heading-4');
	subgroup.add('五级标题', 'heading five', 'heading-5');
	subgroup.add('六级标题', 'heading six', 'heading-6');
	group.add(subgroup);
	group.add(new MenuLine());
	subgroup = new MenuGroup();
	subgroup.add('普通引用', 'quote-right', 'quote-quote');
	subgroup.add('信息引用', 'quote-left', 'quote-info');
	subgroup.add('提醒引用', 'angle-double-right font green', 'quote-success');
	subgroup.add('警告引用', 'angle-right', 'quote-warning');
	subgroup.add('报错引用', 'angle-double-right font red', 'quote-danger');
	group.add(subgroup);
	subgroup = new MenuGroup();
	subgroup.add('无序列表', 'list-ul');
	subgroup.add('有序列表', 'list-ol');
	group.add(subgroup);
	group.add('表格', 'table', 'insert-table');
	group.add(new MenuLine());
	group.add('代码', 'code', 'insert-code');
	group.add('公式', 'square-root-alt', 'insert-latex');
	menuBar.add(group);

	group = new MenuGroup();
	group.add('层进', 'indent', 'levelIn', 'ctrl+alt+Right');
	group.add('层出', 'outdent', 'levelOut', 'ctrl+alt+Left');
	group.add(new MenuLine());
	group.add('左对齐', 'align-left');
	group.add('居中', 'align-center');
	group.add('右对齐', 'align-right');
	group.add(new MenuLine());
	group.add('缩进', 'indent font blue', 'indent');
	group.add('退出', 'outdent font blue', 'outdent');
	menuBar.add(group);

	menuBar.add(new MenuLine());

	group = new MenuGroup();
	group.add('插入超链接', 'link', 'insert-link', 'alt+K');
	group.add('插入图片', 'image', 'insert-image');
	group.add('插入视频', 'video', 'insert-video');
	group.add('插入音频', 'music', 'insert-audio');
	menuBar.add(group);

	group = new MenuGroup();
	group.add('普通分隔线', 'minus', 'headline-normal');
	group.add('双层分隔线', 'grip-lines', 'headline-double');
	group.add('虚线', 'ellipsis-h', 'headline-dotted');
	group.add('点划线', 'window-minimize', 'headline-dashed');
	group.add('渐变线', 'icicles', 'headline-gradient');
	group.add('交叉线', 'grip-horizontal', 'headline-wavy');
	group.add('圈隔线', 'genderless', 'headline-star');
	menuBar.add(group);

	menuBar.add(new MenuLine());

	menuBar.add('插入引用块', 'vector-square', 'insert-block');

	menuBar.add(new MenuLine());

	menuBar.add('帮助文档', 'info-circle', 'help', 'ctrl+H');

	menuBar.add(new MenuLine());

	menuBar.add('关闭本文档', 'times-circle', 'close');

	var sc = menuBar.getShortcuts();
	Object.keys(sc).forEach(key => ShortcutsMap[key] = sc[key]);

	document.querySelector('div.controller.toolbar').appendChild(menuBar.ui);
};

var archieveDB, backendResponser;
const loadArchieve = fingerprint => new Promise(async res => {
	if (!fingerprint) {
		let article = {
			fingerprint: '',
			title: '无存档',
			update: Date.now(),
			content: '',
			usage: []
		};
		return res(article);
	}

	archieveDB = new CachedDB('ArchieveCache', 1);
	await archieveDB.connect();

	var article = await archieveDB.get('cache', fingerprint);
	if (!article) {
		article = {
			fingerprint: '',
			title: '无存档',
			update: Date.now(),
			content: '',
			usage: []
		};
	}
	else {
		article.fingerprint = fingerprint;
	}

	res(article);
});
const loadArticle = id => new Promise(res => {
	if (!!backendResponser) backendResponser();
	backendResponser = res;
	chrome.runtime.sendMessage({ event: 'GetArticleByID', id });
});
const getArticleByID = article => {
	var cb = backendResponser;
	backendResponser = null;
	if (!!cb) cb(article);
};
const loadHelp = () => new Promise(res => {
	var xhr = new XMLHttpRequest();
	xhr.open('get', './demo.mu', true);
	xhr.onreadystatechange = () => {
		if (xhr.readyState == 4) {
			if (xhr.status === 0 || xhr.response === '') return res(null);
			var text = xhr.responseText;
			if (!text) text = '本文档无内容';
			res(text);
		}
	};
	xhr.send();
});

(async () => {
	var query = {};
	var search = location.search;
	search = search.substring(1, search.length);
	search = search.split('&').map(k => k.trim()).filter(k => k.length > 0);
	search.forEach(item => {
		item = item.split('=');
		var key = item.splice(0, 1)[0];
		var value = item.join('=');
		query[key] = value;
	});

	var article, help, actions = [];
	actions.push(new Promise(async res => {help = await loadHelp(); res();}));

	if (!!query.article) {
		fileCategory = 1;
		buildToolBar(1);
		actions.push(new Promise(async res => {article = await loadArchieve(query.article); res();}));
	}
	else if (!!query.id) {
		fileCategory = 2;
		buildToolBar(0);
		actions.push(new Promise(async res => {article = await loadArticle(query.id); res();}));
	}
	else {
		fileCategory = 0;
		buildToolBar(0);
	}

	await Promise.all(actions);

	if (!article || !article.content) {
		if (!article) article = {};
		if (query.action === 'NewFile') {
			article.content = '标题：新文档\n简介：还没\n关键词：没有\n更新：' + num2time(Date.now()) + '\nTOC: on\nGLOSSARY: on\nRESOURCES: on\n\n请开始你的写作……';
			article.title = '';
		}
		else {
			article.content = help;
			article.title = 'MarkUp 帮助文档';
		}
	}

	Object.keys(article).forEach(key => {
		if (key === 'title' && fileCategory !== 1) return;
		var value = article[key];
		if (!value) return;
		articleConfig[key] = value;
	});
	articleConfig.showtitle = true;
	if (query.action === 'NewFile') articleConfig.fingerprint = 'NewFile';

	helpContent = help;
	MUEditor.value = article.content;
	onEdited(false);
	var history = new HistoryItem();
	history.content = article.content;
	history.start = 0;
	history.end = 0;
	history.scroll = 0;
	HistoryManager.clear();
	HistoryManager.append(history);
}) ();

chrome.runtime.onMessage.addListener(msg => {
	if (msg.event === 'ArchieveModified') {
		if (msg.ok) {
			articleConfig.fingerprint = msg.fingerprint
		}
	}
	else if (msg.event === 'SaveArticle') {
		if (msg.saved && fileCategory === 1) {
			location.href = './editor.html?id=' + msg.id;
		}
	}
});

InitNotes(MUPreview);