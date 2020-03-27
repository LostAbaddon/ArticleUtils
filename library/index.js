const query = {};
const Responsers = {};

var CategoryList;
var ArticleList;
var Socket;

Responsers.GetArticleList = list => {
	list = list || ArticleList;
	if (!list) return;
	ArticleList = list;
	ArticleContainer.innerHTML = '';

	var cate = query.path[query.path.length - 1];
	if (!!query.search && query.search.length > 0) {
		let temp = {};
		Object.keys(list).forEach(id => {
			var art = list[id];
			if (art.title.indexOf(query.search) >= 0 || query.search.indexOf(art.title) >= 0) temp[id] = art;
		});
		list = temp;
	}
	else if (!!cate) {
		let temp = {};
		Object.keys(list).forEach(id => {
			var art = list[id];
			if (art.category.includes(cate)) {
				temp[id] = art;
			}
		});
		list = temp;
	}
	else {
		let temp = {};
		Object.keys(list).forEach(id => {
			var art = list[id];
			if (art.category.length === 0 || (art.category.length === 1 && art.category[0] === '#root')) {
				temp[id] = art;
			}
		});
		list = temp;
	}
	list = Object.keys(list).map(id => list[id]);
	list.sort((ia, ib) => ib.update - ia.update);
	list.forEach(item => {
		var ele = newEle('div', 'article-item');
		ele.setAttribute('aid', item.id);
		var temp = newEle('div', 'article-title');
		temp.innerText = item.title;
		ele.appendChild(temp);
		temp = newEle('div', 'article-desc');
		temp.innerText = item.description;
		ele.appendChild(temp);
		temp = newEle('div', 'edit-article');
		temp.setAttribute('aid', item.id);
		temp.innerText = "修改";
		ele.appendChild(temp);
		temp = newEle('div', 'publish-article');
		temp.setAttribute('aid', item.id);
		temp.innerText = "发布";
		ele.appendChild(temp);
		ArticleContainer.appendChild(ele);
	});
};
Responsers.GetArticleCategories = list => {
	list = list || CategoryList;
	if (!list) return;
	CategoryList = list;
	var cate = query.path[query.path.length - 1];
	var menu = [];

	if (!!query.search && query.search.length > 0) {
		Object.keys(list).forEach(kw => {
			if (kw.length == 0 || kw === '#root') return;
			if (kw.indexOf(query.search) >= 0 || query.search.indexOf(kw) >= 0) menu.push(list[kw]);
		});
	}
	else if (!!cate) {
		Object.keys(list).forEach(kw => {
			if (kw === '#root') return;
			var c = list[kw];
			if (c.sups.includes(cate)) menu.push(c);
		});
	}
	else {
		Object.keys(list).forEach(kw => {
			if (kw === '#root') return;
			var c = list[kw];
			if (c.sups.length === 0) menu.push(c);
		});
	}

	cate = newEle('ul', 'cate-menu');
	var menuList = [];
	menu.forEach(item => {
		var ui = newEle('li', 'cate-item');
		var link = newEle('a', 'cate-link nav-link');
		var subs = newEle('ul', 'cate-sub-menu');
		var used = [item.name];
		var tmpPath = [...query.path, item.name];
		var subArts = analyzeSubMenu(list, list[item.name].subs, subs, tmpPath, used);
		var myArts = [...item.articles];
		subArts.forEach(art => {
			if (myArts.includes(art)) return;
			myArts.push(art);
		});
		var count = myArts.length;

		link.innerText = item.name + ' (' + count + ')';
		link.href = './index.html?path=' + tmpPath.join(',');
		ui.appendChild(link);
		if (subs.children.length > 0) ui.appendChild(subs);
		menuList.push([ui, count]);
	});
	if (menuList.length > 0) {
		menuList.sort((a, b) => b[1] - a[1]);
		menuList.forEach(ui => cate.appendChild(ui[0]));
	}

	ArticleMenu.innerHTML = '';
	if (cate.children.length > 0) ArticleMenu.appendChild(cate);
};
Responsers.GetBackendServer = config => {
	var url = 'http://' + config.host + ':' + config.port + '/socket.io/socket.io.js';
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = () => {
		if (xhr.readyState == 4) {
			if (xhr.status === 0 || xhr.response === '') return rej(new Error('Connection Failed'));
			try {
				eval(xhr.responseText);
				Socket = io.connect('http://' + config.host + ':' + config.port);
				if (!!Socket) {
					document.body.classList.add('socketed');
					initSocket();
				}
			}
			catch (err) {
				console.error(err);
			}
		}
	};
	xhr.send();
};
Responsers.PublishArticle = article => {
	var content = {
		id: article.id,
		fingerprint: article.fingerprint,
		title: article.title,
		author: article.author || '',
		file: {
			id: article.id,
			fingerprint: article.fingerprint,
			title: article.title,
			author: article.author,
			email: article.email,
			description: article.description,
			update: article.update,
			category: article.category,
			content: article.content
		},
		channel: 'ArticleMarket'
	};
	Socket.emit('__message__', {
		event: 'publish',
		data: content
	});
};

const initSocket = () => {
	Socket.on('__message__', msg => {
		console.log(msg);
	});
};
const generateNav = () => {
	var nav = '<span><strong>导航：</strong></span><a class="nav-item nav-link" href="./index.html">根目录</a>';
	var t = query.path.length - 1, p = [];
	for (let i = 0; i < t; i ++) {
		let q = query.path[i];
		if (q.length === 0) continue;
		p.push(q);
		let link = '/<a class="nav-item nav-link" href="./index.html?path=' + p.join(',') + '">' + q + '</a>';
		nav += link;
	}
	if (t >= 0) nav += '/<a class="nav-item">' + query.path[t] + '</a>';
	CategoryNav.innerHTML = nav;
};
const analyzeSubMenu = (all, cates, container, path, used) => {
	used = [...used];
	if (!cates || cates.length === 0) return [];
	var totalArts = [];
	var availables = cates.filter(kw => {
		if (used.includes(kw)) return false;
		var c = all[kw];
		if (!c) return false;
		used.push(kw);
		return true;
	});
	var subList = [];
	availables.forEach(kw => {
		var c = all[kw];
		var mine = [...c.articles];

		var item = newEle('li', 'cate-item');
		var link = newEle('a', 'cate-link nav-link');
		var subs = newEle('ul', 'cate-sub-menu');
		var tmpPath = [...path, kw];

		var artList = analyzeSubMenu(all, c.subs, subs, tmpPath, used);
		artList.forEach(art => {
			if (mine.includes(art)) return;
			mine.push(art);
		});

		var count = mine.length;
		mine.forEach(art => {
			if (totalArts.includes(art)) return;
			totalArts.push(art);
		});

		link.innerText = kw + ' (' + count + ')';
		link.href = './index.html?path=' + tmpPath.join(',');
		item.appendChild(link);
		if (subs.children.length > 0) item.appendChild(subs);
		subList.push([item, count]);
	});
	if (subList.length > 0) {
		subList.sort((a, b) => b[1] - a[1]);
		subList.forEach(item => container.appendChild(item[0]));
	}
	return totalArts;
};
const onClick = evt => {
	var ele = evt.target;
	var articleID = ele.getAttribute('aid');
	if (!articleID) return;
	if (ele.classList.contains('edit-article')) {
		location.href = '../markup/editor.html?id=' + articleID;
	}
	else if (ele.classList.contains('publish-article')) {
		chrome.runtime.sendMessage({
			event: 'PublishArticle',
			id: articleID
		});
	}
	else {
		location.href = './view.html?id=' + articleID;
	}
};
const addFile = () => {
	location.href = '../markup/editor.html?action=NewFile';
};
const mgrCate = () => {
	location.href = './manager.html';
};
const search = () => {
	var keyword = SearchKeywords.value;
	if (keyword.length === 0) return;
	query.search = keyword;

	Responsers.GetArticleCategories();
	Responsers.GetArticleList();
};
const navGoto = evt => {
	var btn = evt.target;
	if (!btn.classList.contains('nav-link')) return;
	var path = btn.href.split('path=');
	path.splice(0, 1);
	path = path.join('');
	path = path.split('&')[0];
	path = decodeURIComponent(path);
	path = path.split(',').filter(p => p.length > 0);
	query.path = path;
	query.search = '';
	generateNav();
	Responsers.GetArticleCategories();
	Responsers.GetArticleList();
	history.pushState(null, '', './index.html?path=' + path.join(','));
	evt.preventDefault();
};

ArticleContainer.addEventListener('click', onClick);
AddNewFile.addEventListener('click', addFile);
ManageCategory.addEventListener('click', mgrCate);
SearchArticle.addEventListener('click', search);
CategoryNav.addEventListener('click', navGoto);
ArticleMenu.addEventListener('click', navGoto);
SearchKeywords.addEventListener('keyup', evt => evt.which === 13 && search());

chrome.runtime.onMessage.addListener(msg => {
	var cb = Responsers[msg.event];
	if (!!cb) cb(msg.data);
});

(() => {
	var search = location.search;
	search = search.substring(1, search.length);
	search = search.split('&').map(k => k.trim()).filter(k => k.length > 0);
	search.forEach(item => {
		item = item.split('=');
		var key = item.splice(0, 1)[0];
		var value = item.join('=');
		query[key] = value;
	});
	query.path = decodeURIComponent(query.path || '');
	query.path = query.path.split(',').filter(l => l.length > 0);
	generateNav();
}) ();

chrome.runtime.sendMessage({ event: 'GetBackendServer' });
chrome.runtime.sendMessage({ event: 'GetArticleList' });
chrome.runtime.sendMessage({ event: 'GetArticleCategories' });