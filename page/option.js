window.PageActions = window.PageActions || {};

window.PageActions.LoadConfig = () => {
	var ele = document.querySelector('#extension-export-config');
	var json = JSON.stringify(ExtConfigManager.all(), '', 4);
	json = json.replace(/    /g, '\t');
	ele.value = json;
};
window.PageActions.UpdateConfig = () => {
	var ele = document.querySelector('#extension-export-config');
	var json = ele.value;
	try {
		json = JSON.parse(json);
	} catch (err) {
		console.error(err);
		return;
	}
	Object.keys(json).forEach(key => {
		ExtConfigManager.set(key, json[key]);
	});
};

window.PageActions.onLoad = config => {
	var cfg = config.DefaultSearchEngine;
	Object.keys(cfg).forEach(type => {
		var value = cfg[type];
		if (value === undefined) value = true;
		var target = 'changeDefault:' + type;
		var ele = document.querySelector('input[type="checkbox"][name="' + target + '"]');
		if (!ele) return;
		ele.checked = value;
	});

	window.PageActions.ChangeDefaultSearchEngine = (key, value) => {
		key = key.replace('changeDefault:', '');
		cfg[key] = value;
		ExtConfigManager.set('DefaultSearchEngine', cfg);
	};
};