window.ExtInitActions = {};

const ChangeConfig = (key, value) => {
	ExtConfigManager.set(key, value);
};

document.querySelectorAll('div.option-checkbox').forEach(ele => {
	var checkbox = ele.querySelector('input');
	var label = ele.querySelector('label');
	var itemName = checkbox.name;
	ExtInitActions[itemName] = value => checkbox.checked = value;

	label.addEventListener('click', () => {
		checkbox.checked = !checkbox.checked;
		ChangeConfig(itemName, checkbox.checked);
	});
	checkbox.addEventListener('click', () => {
		ChangeConfig(itemName, checkbox.checked);
	});
});