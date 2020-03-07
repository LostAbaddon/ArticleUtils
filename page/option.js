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