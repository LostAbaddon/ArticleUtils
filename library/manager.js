const Responsers = {};

var Categories;
var NewCateName = NewCategory.querySelector('.content input');
var currCate = null;

const getCateList = (cate, level, used) => {
	used = [...used];
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
const newCate = async () => {
	MaskCover.style.display = 'block';
	NewCategory.style.display = 'block';
	await wait(50);
	NewCategory.style.opacity = '1';
	NewCateName.focus();
};
const hideAll = async () => {
	NewCategory.style.opacity = '0';
	CategoryModify.style.opacity = '0';
	await wait(250);
	NewCateName.value = '';
	MaskCover.style.display = 'none';
	NewCategory.style.display = 'none';
	CategoryModify.style.display = 'none';
};
const addNewCate = async () => {
	var cate = NewCateName.value;
	if (!cate) return;
	if (!!Categories[cate]) return;

	chrome.runtime.sendMessage({ event: 'AddCategories', name: cate });

	NewCategory.style.opacity = '0';
	await wait(250);
	NewCateName.value = '';
	MaskCover.style.display = 'none';
	NewCategory.style.display = 'none';
};
const getSubs = (from, used) => {
	used = used || [];
	if (used.includes(from)) return used;
	var cate = Categories[from];
	if (!cate) return used;
	used.push(from);
	cate.subs.forEach(s => {
		used.push(...getSubs(s));
	});
	return used;
};
const modifyCate = async evt => {
	var target = evt.target.getAttribute('cateName');
	if (!target) return;
	if (target === '#root') return;
	var cate = Categories[target];
	var subs = getSubs(target);
	var list = [];
	Object.keys(Categories).forEach(cate => {
		if (cate === '#root') return;
		if (subs.includes(cate)) return;
		list.push(cate);
	});

	CategoryModify.querySelector('.cateName').innerText = target;
	var ele = CategoryModify.querySelector('.supCates');
	ele.innerHTML = '';
	if (cate.sups.length > 0) cate.sups.forEach(c => {
		var e = newEle('span', 'cate-item sup-cate');
		e.setAttribute('cateName', c);
		e.innerText = c;
		ele.appendChild(e);
	});
	ele = CategoryModify.querySelector('.subCates');
	ele.innerHTML = '';
	if (cate.subs.length > 0) cate.subs.forEach(c => {
		var e = newEle('span', 'sub-cate');
		e.innerText = c;
		ele.appendChild(e);
	});
	ele = CategoryModify.querySelector('.cateList');
	ele.innerHTML = '';
	if (list.length > 0) list.forEach(c => {
		var e = newEle('span', 'cate-item new-cate');
		e.setAttribute('cateName', c);
		e.innerText = c;
		ele.appendChild(e);
	});

	currCate = cate;

	MaskCover.style.display = 'block';
	CategoryModify.style.display = 'block';
	await wait(50);
	CategoryModify.style.opacity = '1';
};
const onClick = evt => {
	var target = evt.target;
	if (!target) return;
	var type = target.classList.contains('new-cate');
	target = target.getAttribute('cateName');
	if (!target) return;

	if (type) {
		currCate.sups.push(target);
		let ui = CategoryModify.querySelector('.cateList .cate-item[catename="' + target + '"]');
		ui.classList.remove('new-cate');
		ui.classList.add('sup-cate');
		CategoryModify.querySelector('.supCates').appendChild(ui);
	}
	else {
		let idx = currCate.sups.indexOf(target);
		if (idx >= 0) currCate.sups.splice(idx, 1);
		let ui = CategoryModify.querySelector('.supCates .cate-item[catename="' + target + '"]');
		ui.classList.remove('sup-cate');
		ui.classList.add('new-cate');
		CategoryModify.querySelector('.cateList').appendChild(ui);
	}
};
const onSubmit = async () => {
	chrome.runtime.sendMessage({ event: 'ModifyArticleCategories', category: currCate });

	CategoryModify.style.opacity = '0';
	await wait(250);
	MaskCover.style.display = 'none';
	CategoryModify.style.display = 'none';
};
const onDelete = async () => {
	chrome.runtime.sendMessage({ event: 'DeleteArticleCategories', target: currCate.name });

	CategoryModify.style.opacity = '0';
	await wait(250);
	MaskCover.style.display = 'none';
	CategoryModify.style.display = 'none';
};

Responsers.GetArticleCategories = list => {
	Categories = list;
	console.log(list);
	window.test = list;

	var cateTree = [];
	cateTree.push(list['#root']);
	var shouldRemoves = [];
	Object.keys(list).forEach(kw => {
		if (kw === '#root') return;
		var c = list[kw];
		var mayRemove = false;
		if (c.sups.length === 0) mayRemove = true;
		if (c.sups.length === 1 && c.sups[0].name === '#root') mayRemove = true;
		if (mayRemove) {
			cateTree.push(c);
			if (c.articles.length === 0 && c.subs.length === 0) {
				shouldRemoves.push(c);
			}
		}
	});
	if (shouldRemoves.length > 0) {
		shouldRemoves = shouldRemoves.map(c => c.name);
		chrome.runtime.sendMessage({ event: 'DeleteArticleCategories', target: shouldRemoves });
	}

	var html = '';
	cateTree.forEach(cate => {
		var used = [];
		var ui = getCateList(cate, 1, used);
		html += ui;
	});
	if (html.length >= 0) {
		html = '<ul class="cate-list">' + html + '</ul>';
	}
	CategoryContainer.innerHTML = html;
};

GoBack.addEventListener('click', () => location.href = './index.html');
AddCategory.addEventListener('click', newCate);
MaskCover.addEventListener('click', hideAll);
AddNewCate.addEventListener('click', addNewCate);
CategoryContainer.addEventListener('click', modifyCate);
NewCateName.addEventListener('keyup', evt => evt.which === 13 && addNewCate());
CategoryModify.addEventListener('click', onClick);
ModifyCate.addEventListener('click', onSubmit);
DeleteCate.addEventListener('click', onDelete);

chrome.runtime.onMessage.addListener(msg => {
	var cb = Responsers[msg.event];
	if (!!cb) cb(msg.data);
});

chrome.runtime.sendMessage({ event: 'GetArticleCategories' });