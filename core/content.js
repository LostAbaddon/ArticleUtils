const autoMath = () => new Promise(res => {
	var hasMathJax = [].some.call(document.querySelectorAll('script'), script => {
		return script.src.toLowerCase().indexOf('mathjax') >= 0;
	});
	if (hasMathJax) return res();

	var content = document.body.innerText.split(/\n{2,}/);
	hasMathJax = content.some(line => {
		if (!!line.match(/\$[^\n\$]+?\$/)) return true;
		if (!!line.match(/\$\$\n[^\$]+?\n\$\$/)) return true;
	});
	if (!hasMathJax) return res();

	var config = newEle('script');
	config.type = 'text/x-mathjax-config';
	config.innerHTML = `MathJax.Hub.Config({
		extensions: ["tex2jax.js"],
		TeX: {
			extensions: ["AMSmath.js", "AMSsymbols.js"]
		},
		jax: ["input/TeX", "output/HTML-CSS"],
		tex2jax: {
			inlineMath: [["$","$"]]}
		});`;
	document.body.appendChild(config);

	loadJS(chrome.extension.getURL('MathJax2.5/MathJax.js?config=TeX-AMS_HTML'), () => {
		res();
	});
});

const onInit = async config => {
	if (config.AutoMath) {
		await autoMath();
		await wait();
	}

	findResources();
};

const findResources = () => {
	var content = document.body.innerText.match(/<[^\n]+?>|《[^\n]+?》/gi);
	if (!!content) content = content.map(title => title.substring(1, title.length - 1).trim());
	else content = [];
	var headers = [...document.querySelectorAll('h1'), ...document.querySelectorAll('h1')];
	if (!!headers) {
		headers = headers.map(head => {
			if (head.children.length === 0) return head.innerText.trim();
			var title = head.innerText.trim();
			[].some.call(head.children, ele => {
				var name = ele.innerText;
				if (!name) return;
				name = name.trim();
				if (name.length === 0) return;
				title = name;
				return true;
			});
			return title;
		});
		headers = [...content, ...headers];
	} else {
		headers = content;
	}
	content = [];
	headers.forEach(title => {
		if (content.includes(title)) return;
		content.push(title);
	});

	chrome.runtime.sendMessage({
		event: 'FindResource',
		targets: content
	});
};
const onGetResource = resource => {
	console.log('VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
	console.log(' VVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
	console.log('   VVVVVVVVVVVVVVVVVVVVVVVVV');
	console.log('      VVVVVVVVVVVVVVVVVVV');
	console.log('          VVVVVVVVVVV');
	console.log('               V');
	console.log(resource);
	console.log('               V');
	console.log('              VVV');
	console.log('            VVVVVVV');
	console.log('         VVVVVVVVVVVVV');
	console.log('     VVVVVVVVVVVVVVVVVVVVV');
	console.log('VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
};

ExtConfigManager(DefaultExtConfig, (event, key, value) => {
	if (event === 'init') onInit(key);
});

RegiestKeySeq('ctrl+ctrl+m', 'ConvertMath', async () => {
	var last = ExtConfigManager.get('AutoMath');
	await ExtConfigManager.set('AutoMath', !last);
	if (last) {
		window.location.reload();
	} else {
		autoMath();
	}
});

chrome.runtime.onMessage.addListener(msg => {
	if (msg.event === 'GotResource') onGetResource(msg.resource);
});