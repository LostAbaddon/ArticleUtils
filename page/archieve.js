const Translators = {
	caiyun: '彩云小译',
	iciba: "金山词霸",
	bing: 'Bing 翻译',
	google: '谷歌翻译'
};
const ResourceTypes = {
	article: '相关文章',
	book: "相关书籍",
	pedia: '相关百科',
	video: '相关视频',
	news: '相关新闻',
	common: '其它结果'
};

var archieveDB, menu, editing = false, translating = false;

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
const getSelectedText = () => {
	var selection = document.getSelection();
	var text = selection.toString();
	return text.replace(/^[ \n\t\r]+|[ \n\t\r]+$/gi, '');

	if (text.length === 0) {
		let sel = selection.getRangeAt(0);
		sel = sel.startContainer;
		let tag = sel.tagName;
		if (!!tag) {
			tag = tag.toLowerCase();
			if (tag === 'input' || tag === 'textarea') {
				text = sel.value;
			} else {
				let ele = sel.querySelector('input');
				if (!ele) ele = sel.querySelector('textarea');
				if (!!ele) {
					text = ele.value;
				}
			}
		}
	} else {
		text = text.replace(/^[ \n\t\r]+|[ \n\t\r]+$/gi, '');
	}

	return text;
};

const generateMenu = () => {
	var articleMenu = document.querySelector('#articleList');
	menu.forEach(item => {
		var ele = newEle('menuitem');
		ele.setAttribute('fingerprint', item[0]);
		ele.innerHTML = item[1];
		articleMenu.appendChild(ele);
	});
	articleMenu.addEventListener('click', evt => {
		var fingerprint = evt.target.getAttribute('fingerprint');
		if (!fingerprint) return;
		showArticle(fingerprint);
	});
};
const showArticle = async fingerprint => {
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

	var ele = document.querySelector('#articleContainer');
	ele.setAttribute('fingerprint', fingerprint);
	ele = document.querySelector('#articleContainer section.mainContainer footer [name="fingerprint"]');
	ele.innerText = fingerprint;

	ele = document.querySelector('#articleContainer header span');
	ele.innerText = article.title;

	ele = document.querySelector('#articleContainer section.mainContainer aside time');
	ele.innerText = num2time(article.update);

	ele = document.querySelector('#articleContainer section.mainContainer main');
	ele.innerText = article.content.replace(/^[ 　\n\t\r]+|[ 　\n\t\r]+$/gi, '').replace(/[\r\n]{2,}/gi, '\n\n');

	ele = document.querySelector('#articleContainer section.mainContainer footer ul');
	ele.innerHTML = '';
	article.usage.forEach(url => {
		var ui = newEle('li');
		var link = newEle('a');
		link.target = "_blank";
		link.href = url;
		link.innerText = url;
		ui.appendChild(link);
		ele.appendChild(ui);
	});
};

const unarchieve = fingerprint => {
	var removes = [];
	menu.forEach((item, index) => {
		if (item[0] === fingerprint) removes.unshift(index);
	});
	removes.forEach(i => menu.splice(i, 1));
	document.querySelectorAll('#articleList menuitem[fingerprint="' + fingerprint + '"]').forEach(item => {
		item.parentNode.removeChild(item);
	});
	showArticle(menu[0]);
};
const titleModified = (fingerprint, title, ok, err) => {
	if (!ok) {
		Alert.show('<div style="text-align:center;">' + err + '</div>', '<span style="color:red;">出错啦！</span>');
		return;
	}
	menu.some(item => {
		if (item[0] !== fingerprint) return false;
		item[1] = title;
	});
	document.querySelector('menuitem[fingerprint="' + fingerprint + '"]').innerText = title;
};

var transUI = document.querySelector('div#translationFrame');
const toggleTranslation = () => {
	var text = getSelectedText();
	if (!text) return;
	text = text.replace(/^[ \t\r\n]+|[ \t\r\n]+$/gi, '');
	if (!text) return;

	Alert.notify('开始翻译：' + text);
	chrome.runtime.sendMessage({
		event: 'ToggleTranslation',
		target: text
	});
};
const gotTranslation = async list => {
	translating = true;
	transUI.innerHTML = '';
	Object.keys(list).forEach(key => {
		var line = list[key];
		var source = Translators[key] || '未知译者';
		var ele = newEle('div', 'translation_source');
		ele.innerText = source;
		transUI.appendChild(ele);
		ele = newEle('div', 'translation_result');
		ele.innerText = line;
		transUI.appendChild(ele);
	});

	var range = document.getSelection();
	range = range.getRangeAt(0);
	range = range.getBoundingClientRect();

	var width = range.width;
	if (width < 400) width = 400;
	var top = range.top + range.height;
	var isUp = true;
	if (top + 600 > window.innerHeight) {
		isUp = false;
		top = window.innerHeight - range.top;
	}
	var left = range.left;
	if (left + width + 100 > window.innerWidth) left = range.right - width;

	transUI.style.display = 'block';
	if (isUp) {
		transUI.style.top = top + 'px';
		transUI.style.bottom = '';
	} else {
		transUI.style.top = ''
		transUI.style.bottom = top + 'px';
	}
	transUI.style.left = left + 'px';
	transUI.style.width = width + 'px';
	await wait(50);
	transUI.style.opacity = '1';
};
const hideTranslation = async evt => {
	var ele = evt.target;
	if (ele === transUI || ele.parentElement === transUI) return;

	if (!translating) return;
	translating = false;

	transUI.style.opacity = '0';
	await wait(300);
	transUI.style.display = 'none';
};

const toggleSearch = (type, id) => {
	var text = getSelectedText(), force;
	if (text.length === 0) return;
	force = isNumber(id);
	text = [text];

	if (type === 'article') Alert.notify('开始寻找文章资源');
	else if (type === 'book') Alert.notify('开始寻找书籍资源');
	else if (type === 'pedia') Alert.notify('开始寻找百科资源');
	else if (type === 'video') Alert.notify('开始寻找影视资源');
	else if (type === 'news') Alert.notify('开始寻找新闻资源');
	else if (type === 'common') Alert.notify('开始寻找综合资源');
	else if (force) Alert.notify('开始寻找指定资源');
	else Alert.notify('开始寻找页面资源');

	chrome.runtime.sendMessage({
		event: 'FindResource',
		action: type,
		engine: id,
		force,
		auto: false,
		targets: text
	});
};
const gotSearchResult = (name, type, results) => {
	Alert.notify("找到“" + name + '”的资源，将显示在底部');

	var area = document.querySelector('section#searchResultList');
	area.innerHTML = '';
	area.style.display = 'block';
	Object.keys(ResourceTypes).forEach(type => {
		var list = results[type];
		if (!list) return;
		list = list[name];
		if (!list || list.length === 0) return;
		type = ResourceTypes[type];

		var ele = newEle('div', 'search_list_typename');
		ele.innerText = type + '：';
		area.appendChild(ele);
		ele = newEle('ul', 'search_list_area');
		area.appendChild(ele);
		list.forEach(item => {
			var line = newEle('li', 'search_list_line');
			var link = newEle('a');
			link.target = '_blank';
			link.href = item[1];
			link.innerText = item[0];
			line.appendChild(link);
			ele.appendChild(line);
		});
	});
};

(async () => {
	chrome.runtime.onMessage.addListener(msg => {
		if (msg.event === "ArchieveDeleted") unarchieve(msg.fingerprint);
		else if (msg.event === 'ArchieveTitleModified') titleModified(msg.fingerprint, msg.title, msg.ok, msg.err);
		else if (msg.event === 'ToggleTranslation') toggleTranslation();
		else if (msg.event === 'GotTranslation') gotTranslation(msg.action);
		else if (msg.event === "ToggleSearch") toggleSearch((msg.action || 'all').toLowerCase(), msg.id);
		else if (msg.event === "GotResource") gotSearchResult(msg.targetName, msg.targetType, msg.resource);
		else console.log(msg);
	});

	document.querySelector('#articleContainer section footer .title .button[name=deleteArchieve]').addEventListener('click', () => {
		var container = document.querySelector('#articleContainer');
		chrome.runtime.sendMessage({
			event: 'DeleteArchieve',
			fingerprint: container.getAttribute('fingerprint')
		});
	});
	document.querySelector('#articleContainer header').addEventListener('click', async () => {
		if (editing) return;
		editing = true;
		var ele = document.querySelector('#articleContainer header span');
		ele.setAttribute('contentEditable', true);
		await wait(50);
		ele.focus();
	});
	document.querySelector('#articleContainer header span').addEventListener('blur', () => {
		if (!editing) return;
		editing = false;
		var newTitle = document.querySelector('#articleContainer header span').innerText;
		newTitle = newTitle.replace(/^[ 　\n\t\r]+|[ 　\n\t\r]+$/gi, '');
		var fingerprint = document.querySelector('#articleContainer').getAttribute('fingerprint');
		chrome.runtime.sendMessage({
			event: 'ModifyArchieveTitle',
			fingerprint,
			title: newTitle
		});
		document.querySelector('#articleContainer header span').setAttribute('contenteditable', false);
	});
	document.body.addEventListener('mousedown', hideTranslation);
	document.body.addEventListener('mousewheel', hideTranslation);

	archieveDB = new CachedDB('ArchieveCache', 1);
	await archieveDB.connect();

	var articles = await archieveDB.all('cache');
	menu = Object.keys(articles).map(fingerprint => {
		var item = articles[fingerprint];
		return [fingerprint, item.update, item.title];
	});
	menu.sort((arc1, arc2) => arc2[1] - arc1[1]);
	menu = menu.map(item => [item[0], item[2]]);
	generateMenu();
	showArticle(menu[0][0]);
}) ();