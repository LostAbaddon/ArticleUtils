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
}) ();

const Responsers = {};

Responsers.GetArticleByID = data => {
	ArticleTitle.querySelector('p').innerText = data.title;
	ArticleContent.innerHTML = MarkUp.parse(data.content, {
		showtitle: false,
		resources: true,
		glossary: true,
		toc: true
	});

	if (!!data.category) data.category.forEach(kw => {
		var ui = newEle('span', 'keyword');
		ui.innerText = kw;
		ArticleKeywords.appendChild(ui);
	});
};

GoBacker.addEventListener('click', () => {
	location.href = './index.html';
});
Editor.addEventListener('click', () => {
	location.href = '../markup/editor.html?id=' + query.id;
});

chrome.runtime.onMessage.addListener(msg => {
	var cb = Responsers[msg.event];
	if (!!cb) cb(msg.data);
});

chrome.runtime.sendMessage({ event: 'GetArticleByID', id: query.id });

InitNotes(ArticleContent);