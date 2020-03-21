const query = {};
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

	var nav = '<span><strong>导航：</strong></span><a class="nav-item" href="./index.html">根目录</a>';
	var t = query.path.length - 1, p = [];
	for (let i = 0; i < t; i ++) {
		let q = query.path[i];
		p.push(q);
		let link = '/<a class="nav-item" href="./index.html?path=' + p.join(',') + '">' + q + '</a>';
		nav += link;
	}
	nav += '/<a class="nav-item">' + query.path[t] + '</a>';
	CategoryNav.innerHTML = nav;
}) ();

const Responsers = {};

Responsers.GetArticleList = list => {
	var cate = query.path[query.path.length - 1];
	if (!!cate) {
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
			if (art.category.length === 0) {
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
		ArticleContainer.appendChild(ele);
	});
};
Responsers.GetArticleCategories = list => {
	var cate = query.path[query.path.length - 1];
	var menu = [];

	if (!!cate) {
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

	cate = newEle('ul', 'cate-menu')
	menu.forEach(item => {
		var ui = newEle('li', 'cate-item');
		var link = newEle('a', 'cate-link');
		link.innerText = item.name + ' (' + item.articles.length + ')';
		var temp = query.path.map(l => l);
		temp.push(item.name);
		link.href = './index.html?path=' + temp.join(',');
		ui.appendChild(link);
		cate.appendChild(ui);
	});
	ArticleMenu.innerHTML = '';
	ArticleMenu.appendChild(cate);
};

const getCateList = (cate, level, used) => {
	if (!cate) return '';
	if (used.includes(cate.name)) return '';
	used.push(cate.name);

	var name = cate.name;
	if (name === '#root') name = '未分类';
	name += ' (' + cate.articles.length + ')';
	var ui = '<li class="level-' + level + '"><p class="cate-title" cateName="' + cate.name + '">' + name + '</p>';
	var subUI = '';
	cate.subs.forEach(sub => {
		sub = Categories[sub];
		subUI += getCateList(sub, level + 1, used);
	});
	if (subUI.length > 0) {
		subUI = '<ul class="sub-cate-list">' + subUI + '</ul>';
		ui += subUI;
	}
	ui += '</li>';
	return ui;
};
const onClick = evt => {
	var ele = evt.target;
	var articleID = ele.getAttribute('aid');
	if (!articleID) return;
	if (ele.classList.contains('edit-article')) {
		location.href = '../markup/editor.html?id=' + articleID;
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

ArticleContainer.addEventListener('click', onClick);
AddNewFile.addEventListener('click', addFile);
ManageCategory.addEventListener('click', mgrCate);

chrome.runtime.onMessage.addListener(msg => {
	var cb = Responsers[msg.event];
	if (!!cb) cb(msg.data);
});

chrome.runtime.sendMessage({ event: 'GetArticleList' });
chrome.runtime.sendMessage({ event: 'GetArticleCategories' });