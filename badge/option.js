window.PageActions = window.PageActions || {};

window.PageActions.LoadConfig = () => {
	var ele = document.querySelector('#extension-export-config');
	var json = JSON.stringify(ExtConfigManager.all(), '', 4);
	json = json.replace(/    /g, '\t');
	ele.value = json;
};