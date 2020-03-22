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
	if (t >= 0) nav += '/<a class="nav-item">' + query.path[t] + '</a>';
	CategoryNav.innerHTML = nav;
}) ();

const Responsers = {};

Responsers.GetArticleList = list => {
	if (!list) return;
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
		ArticleContainer.appendChild(ele);
	});
};
Responsers.GetArticleCategories = list => {
	if (!list) return;
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

		cate.appendChild(ui);
	});
	ArticleMenu.innerHTML = '';
	if (cate.children.length > 0) ArticleMenu.appendChild(cate);
};

const analyzeSubMenu = (all, cates, container, path, used) => {
	if (!cates || cates.length === 0) return [];
	var totalArts = [];
	var availables = cates.filter(kw => {
		if (used.includes(kw)) return false;
		var c = all[kw];
		if (!c) return false;
		used.push(kw);
		return true;
	});
	availables.forEach(kw => {
		var c = all[kw];
		var mine = [...c.articles];

		var item = newEle('li', 'cate-item');
		var link = newEle('a', 'cate-link');
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
		container.appendChild(item);
	});
	return totalArts;
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