window.PageActions = window.PageActions || {};

window.PageActions.onLoad = config => {
	const cancelRuleArea = () => {
		document.querySelector('div#RuleArea').style.display = 'none';
	};

	chrome.tabs.getSelected(tab => {
		var url = tab.url.split('?')[0];
		var protocol = url.split('://')[0];
		if (!protocol) return cancelRuleArea();
		var low = protocol.toLowerCase();
		if (low.indexOf('chrome') >= 0 || low.indexOf('devtool') >= 0) return cancelRuleArea();
		url = url.replace(protocol + '://', '');
		url = url.split('/');
		if (url.length > 2) url.splice(2, url.length - 2);
		url = url.join('/');

		document.querySelector('span#DomainName').innerText = url;

		var cfg = config.SilenceRules;
		var rules = cfg[url];
		if (!rules) {
			rules = {
				article: true,
				book: true,
				pedia: true,
				video: true,
				news: true,
				common: true
			};
			cfg[url] = rules;
		} else {
			if (rules.article === undefined) rules.article = true;
			if (rules.book === undefined) rules.book = true;
			if (rules.pedia === undefined) rules.pedia = true;
			if (rules.video === undefined) rules.video = true;
			if (rules.news === undefined) rules.news = true;
			if (rules.common === undefined) rules.common = true;
		}

		Object.keys(rules).forEach(name => {
			document.querySelector('div#RuleArea input[type=checkbox][name="search:' + name + '"]').checked = rules[name];
		});

		window.PageActions.ChangeSearchRule = (key, value) => {
			key = key.replace('search:', '');
			rules[key] = value;
			ExtConfigManager.set('SilenceRules', cfg);
		};
	});
};
