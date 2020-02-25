window.ExtInitActions = {};

const ChangeConfig = (key, value) => {
	ExtConfigManager.set(key, value);
};

document.querySelectorAll('div.option-checkbox').forEach(ele => {
	var checkbox = ele.querySelector('input');
	var itemName = checkbox.name;
	ExtInitActions[itemName] = value => checkbox.checked = value;

	ele.querySelectorAll('label').forEach(label => {
		label.addEventListener('click', () => {
			checkbox.checked = !checkbox.checked;
			ChangeConfig(itemName, checkbox.checked);
		});
	});
	checkbox.addEventListener('click', () => {
		ChangeConfig(itemName, checkbox.checked);
	});
});
document.querySelectorAll('div.option-inputer').forEach(ele => {
	var inputter = ele.querySelector('input');
	var itemName = inputter.name;
	ExtInitActions[itemName] = value => inputter.value = value;

	var change = () => {
		ChangeConfig(itemName, inputter.value);
	};
	ele.querySelectorAll('label').forEach(label => {
		label.addEventListener('click', () => {
			inputter.focus();
		});
	});
	inputter.addEventListener('change', change);
	inputter.addEventListener('blur', change);
	inputter.addEventListener('keydown', evt => {
		if (!evt) return;
		if (!evt.key) return;
		var key = evt.key.toLowerCase();
		if (key === 'enter') change();
	});
});