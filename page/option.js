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
window.PageActions.LoadBackendCfg = () => {
	var cfg = ExtConfigManager.all();
	cfg.BackendServer = cfg.BackendServer || {
		"host": "127.0.0.1",
		"port": 8001
	};
	var ele = document.querySelector('div[name="BackendConfig"]');
	ele.querySelector('input[name="host"]').value = cfg.BackendServer.host;
	ele.querySelector('input[name="port"]').value = cfg.BackendServer.port;
};
window.PageActions.ConfirmBackend = () => {
	var cfg = ExtConfigManager.all();
	cfg.BackendServer = cfg.BackendServer || {
		"host": "127.0.0.1",
		"port": 8001
	};
	var ele = document.querySelector('div[name="BackendConfig"]');
	var host = ele.querySelector('input[name="host"]').value || cfg.BackendServer.host;
	var port = ele.querySelector('input[name="port"]').value * 1;
	if (isNaN(port)) port = cfg.BackendServer.port;
	cfg.BackendServer.host = host;
	cfg.BackendServer.port = port;
	ExtConfigManager.set("BackendServer", cfg.BackendServer);
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