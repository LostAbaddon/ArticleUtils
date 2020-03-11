var articles, menu;

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

const generateMenu = () => {
	var articleMenu = document.querySelector('#articleList');
	menu.forEach(fingerprint => {
		var ele = newEle('menuitem');
		ele.setAttribute('fingerprint', fingerprint);
		ele.innerHTML = articles[fingerprint].title;
		articleMenu.appendChild(ele);
	});
	articleMenu.addEventListener('click', evt => {
		var fingerprint = evt.target.getAttribute('fingerprint');
		if (!fingerprint) return;
		showArticle(fingerprint);
	});
};
const showArticle = fingerprint => {
	var article = articles[fingerprint];
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

	ele = document.querySelector('#articleContainer header span');
	ele.innerText = article.title;

	ele = document.querySelector('#articleContainer section.mainContainer aside time');
	ele.innerText = num2time(article.update);

	ele = document.querySelector('#articleContainer section.mainContainer main');
	ele.innerText = article.content;

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
	menu.forEach((fp, index) => {
		if (fp === fingerprint) removes.unshift(index);
	});
	removes.forEach(i => menu.splice(i, 1));
	document.querySelectorAll('#articleList menuitem[fingerprint="' + fingerprint + '"]').forEach(item => {
		item.parentNode.removeChild(item);
	});
	showArticle(menu[0]);
};

(async () => {
	chrome.runtime.onMessage.addListener(msg => {
		if (msg.event === "ArchieveDeleted") unarchieve(msg.fingerprint);
	});

	document.querySelector('#articleContainer section footer .title .button[name=deleteArchieve]').addEventListener('click', () => {
		var container = document.querySelector('#articleContainer');
		chrome.runtime.sendMessage({
			event: 'DeleteArchieve',
			fingerprint: container.getAttribute('fingerprint')
		});
	});

	var db = new CachedDB('ArchieveCache', 1);
	await db.connect();

	articles = await db.all('cache');
	menu = Object.keys(articles).map(fingerprint => [fingerprint, articles[fingerprint].update]);
	menu.sort((arc1, arc2) => arc2[1] - arc1[1]);
	menu = menu.map(item => item[0]);
	generateMenu();
	showArticle(menu[0]);
}) ();