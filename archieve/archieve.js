const UpRate = 0.9;
const DownRate = 0.95;
const ChildRate = 0.1;
const ArticleComponents = ['span', 'p', 'font', 'b', 'strong', 'i', 'u', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'blockquote', 'code', 'pre', '#text'];
const IgnoreComponents = ['script', 'style', 'link', 'ref', 'rel', 'img', 'video', 'audio', 'iframe', 'br', 'hr', '#comment'];

const findArticleContainer = () => {
	var result = [];
	rateNode(document.body, result);
	result.sort((a, b) => b[1] - a[1]);
	var target = result[0][0];
	var list = new Map();
	result.forEach(item => list.set(...item));
	return [target, list];
};
const rateNode = (node, result) => {
	var current = [], children = [];
	if (!node.childNodes) return 0;
	node.childNodes.forEach(node => {
		var tag = node.nodeName;
		if (!tag) return;
		tag = tag.toLowerCase();
		if (IgnoreComponents.includes(tag)) return;
		if (ArticleComponents.includes(tag)) {
			let text = node.textContent || node.innerText || '';
			text = text.replace(/[　\t\r\n]+/g, '').trim();
			current.push(text.length);
			if (tag !== '#text') result.push([node, text.length]);
		} else {
			children.push(rateNode(node, result) * UpRate);
		}
	});
	var score = 0;
	if (children.length > 0) {
		children.sort((a, b) => a - b);
		score = children.reduce((last, current) => last * DownRate + current, 0) / (children.length * ChildRate + 1);
	}
	score = current.reduce((a, b) => a + b, score);
	result.push([node, score]);
	return score;
};
const findArticleTitle = () => {
	var titles = [ document.title ];
	document.querySelectorAll('h1').forEach(h => titles.push(h.innerText));
	document.querySelectorAll('h2').forEach(h => titles.push(h.innerText));
	document.querySelectorAll('.title').forEach(h => titles.push(h.innerText));
	titles = titles.map(
		t => t.replace(/[\r\n]+/gi, '').replace(/^[ 　\t]+|[ 　\t]+$/gi, '')
	).filter(l => l.length > 0);

	var result = {};
	var total = titles.length, limit = 0;
	for (let i = 0; i < total; i ++) {
		let t1 = titles[i];
		if (t1.length === 0) continue;
		result[t1] = (result[t1] || 0) + 1;
		for (let j = i + 1; j < total; j ++) {
			let t2 = titles[j];
			if (t2.length === 0) continue;
			let t = getLongestCommonPart(t1, t2);
			t = t.replace(/^[ 　\t]+|[ 　\t]+$/gi, '');
			if (t.length > 0) result[t] = (result[t] || 0) + 1;
		}
	}
	total = 0;
	Object.keys(result).forEach(title => {
		var key = title.replace(/[,\.;:\?!'"\-\+=\(\)\[\]\{\}\\\/@#\$\^%&\|\*_<>`~，。？！《》；：‘’“”【】（）·￥…—　 \t]+/g, '');
		key = key.split('').filter(c => {
			c = c.charCodeAt(0);
			return c < 128 || c > 255;
		}).join('');
		var old = result[title];
		score = old * Math.sqrt(key.length);
		result[title] = score;
		limit += score ** 3;
		total ++;
	});
	if (total <= 1) return Object.keys(result)[0];

	limit /= total;
	limit = limit ** (1 / 3);
	titles = [];
	Object.keys(result).forEach(title => {
		var score = result[title];
		if (score < limit) return;
		titles.push([title, score]);
	});
	titles.sort((t1, t2) => t2[1] - t1[1]);
	if (titles.length === 1) return titles[0][0];
	var temp_title = titles[0][0];

	while (titles.length > 1) {
		result = {};
		total = titles.length;
		for (let i = 0; i < total; i ++) {
			let [t1, s1] = titles[i];
			result[t1] = (result[t1] || 0) + 1;
			for (let j = i + 1; j < total; j ++) {
				let [t2, s2] = titles[j];
				let t = getLongestCommonPart(t1, t2);
				t = t.replace(/^[ 　\t]+|[ 　\t]+$/gi, '');
				if (t.length > 0) result[t] = (result[t] || 0) + s1 + s2;
			}
		}

		total = 0;
		limit = 0;
		Object.keys(result).forEach(title => {
			var key = title.replace(/[,\.;:\?!'"\-\+=\(\)\[\]\{\}\\\/@#\$\^%&\|\*_<>`~，。？！《》；：‘’“”【】（）·￥…—　 \t]+/g, '');
			key = key.split('').filter(c => {
				c = c.charCodeAt(0);
				return c < 128 || c > 255;
			}).join('');
			var old = result[title];
			score = old * Math.sqrt(key.length);
			result[title] = score;
			limit += score ** 3;
			total ++;
		});
		if (total <= 1) return Object.keys(result)[0];

		limit /= total;
		limit = limit ** (1 / 3);
		titles = [];
		Object.keys(result).forEach(title => {
			var score = result[title];
			if (score < limit) return;
			titles.push([title, score]);
		});
		if (titles.length <= 1) return Object.keys(result)[0];
		titles.sort((t1, t2) => t2[1] - t1[1]);

		let t = titles[0];
		if (!!t) t = t[0];
		if (!!t) temp_title = t;
	}

	return temp_title;
};

window.Archieve = {
	_initialed: false,
	_pad: null,
	_target: null,
	_scoreMap: new Map(),
	_title: '',
	_active: false
};
window.Archieve.init = () => {
	if (Archieve._initialed) return;
	Archieve._initialed = true;

	var style = newEle('link');
	style.rel = 'stylesheet';
	style.href = chrome.extension.getURL('/archieve/archieve.css');
	document.body.appendChild(style);

	var lastClick = 0;
	document.body.addEventListener('click', async evt => {
		if (!Archieve._active) return;

		var now = Date.now();
		if (now - lastClick > 300) {
			lastClick = now;
			return;
		}
		lastClick = now;

		var ele = evt.target;
		while (!Archieve._scoreMap.has(ele) && ele !== document.body) {
			ele = ele.parentElement;
		}
		if (ele === document.body) return;

		document.querySelectorAll('.extension_archieve_selected').forEach(async e => {
			e.classList.remove('extension_archieve_focused');
			await wait(200);
			e.classList.remove('extension_archieve_selected');
		});
		Archieve._target = ele;
		Archieve.select();
		ele.classList.add('extension_archieve_selected');
		await wait(50);
		ele.classList.add('extension_archieve_focused');
	});

	Archieve._pad = newEle('div', 'extension_archieve_controller');
	Archieve._pad.innerHTML = `<div class="extension_archieve_hash">当前内容指纹：<span></span></div>
		<div class="extension_archieve_confirm button">存档当前选定内容<span class="title_hint"></span></div>
		<div class="extension_archieve_levelup button"></div>
		<div class="extension_archieve_leveldown button"></div>
		<div class="extension_archieve_close button"></div>`;
	Archieve._pad.querySelector('div.extension_archieve_levelup').addEventListener('click', async () => {
		var ele = Archieve._target.parentElement;
		if (!Archieve._scoreMap.has(ele)) return;
		document.querySelectorAll('.extension_archieve_selected').forEach(async e => {
			e.classList.remove('extension_archieve_focused');
			await wait(200);
			e.classList.remove('extension_archieve_selected');
		});
		Archieve._target = ele;
		Archieve.select();
		ele.classList.add('extension_archieve_selected');
		await wait(50);
		ele.classList.add('extension_archieve_focused');
	});
	Archieve._pad.querySelector('div.extension_archieve_leveldown').addEventListener('click', async () => {
		var ele, score = 0;
		Archieve._target.childNodes.forEach(e => {
			if (!Archieve._scoreMap.has(e)) return;
			var s = Archieve._scoreMap.get(e);
			s = s * 1;
			if (isNaN(s)) return;
			if (s <= score) return;
			score = s;
			ele = e;
		});
		if (!ele) return;
		document.querySelectorAll('.extension_archieve_selected').forEach(async e => {
			e.classList.remove('extension_archieve_focused');
			await wait(200);
			e.classList.remove('extension_archieve_selected');
		});
		Archieve._target = ele;
		Archieve.select();
		ele.classList.add('extension_archieve_selected');
		await wait(50);
		ele.classList.add('extension_archieve_focused');
	});
	Archieve._pad.querySelector('div.extension_archieve_close').addEventListener('click', async () => {
		Archieve._active = false;
		document.querySelectorAll('.extension_archieve_selected').forEach(async e => {
			e.classList.remove('extension_archieve_focused');
			await wait(200);
			e.classList.remove('extension_archieve_selected');
		});
		Archieve._pad.classList.remove('show');
	});
	Archieve._pad.querySelector('div.extension_archieve_confirm').addEventListener('mousedown', async () => {
		Archieve._active = false;
		var text = document.getSelection().toString();
		text = text.replace(/^[ 　\t\r\n]+|[ 　\t\r\n]+$/gi, '');
		if (text.length === 0) {
			text = MarkUp.reverse(Archieve._target);
		}
		fingerprint = SHA256.FingerPrint(text);
		document.querySelectorAll('.extension_archieve_selected').forEach(async e => {
			e.classList.remove('extension_archieve_focused');
			await wait(200);
			e.classList.remove('extension_archieve_selected');
		});
		Archieve._pad.classList.remove('show');

		chrome.runtime.sendMessage({
			event: 'ArchieveArticle',
			fingerprint,
			title: Archieve._title,
			content: text,
			url: location.href.replace(location.search, '')
		});
	});
	document.body.appendChild(Archieve._pad);
};
window.Archieve.launch = async () => {
	Archieve._active = true;
	Archieve._title = findArticleTitle();
	Archieve._pad.classList.add('show');
	Archieve._pad.querySelector('div.extension_archieve_confirm span.title_hint').innerText = ' (' + Archieve._title + ')';

	Archieve._scoreMap.clear();
	[Archieve._target, Archieve._scoreMap] = findArticleContainer();
	Archieve.select();
	Archieve._target.classList.add('extension_archieve_selected');
	await wait(50);
	Archieve._target.classList.add('extension_archieve_focused');
};
window.Archieve.select = async () => {
	Archieve._target.scrollIntoViewIfNeeded();
	var fingerprint = SHA256.FingerPrint(Archieve._target.innerText || Archieve._target.textContent || '');
	Archieve._pad.querySelector('div.extension_archieve_hash span').innerText = fingerprint;
};