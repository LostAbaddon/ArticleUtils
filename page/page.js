window.ExtInitActions = {};

const ChangeConfig = (key, value) => {
	ExtConfigManager.set(key, value);
};

const ToggleAction = action => {
	if (!window.PageActions) return;
	action = window.PageActions[action];
	if (!action) return;
	action();
};

document.querySelectorAll('div.option-list-container').forEach(ele => {
	var cfgList = [];

	var target = ele.getAttribute('name');
	if (!isString(target)) return;

	var template = ele.innerHTML.trim();
	if (template.length === 0) return;
	ele.innerHTML = '';

	var areaTitle = ele.getAttribute('title');
	var clickable = ele.getAttribute('clickable');
	if (!!areaTitle && areaTitle.length > 0) {
		let t = newEle('div', 'option-title');
		t.innerText = areaTitle;
		if (isString(clickable)) t.classList.add('clickable');
		else t.classList.add('nonclickable');
		ele.appendChild(t);
	}

	var onChange = (id, key, value) => {
		id *= 1;
		if (!isNumber(id)) return;

		if (key === 'delete') {
			ele.querySelectorAll('[data-id]').forEach(item => {
				var iid = item.dataset.id * 1;
				if (iid < id) return;
				if (iid > id) {
					item.dataset.id = iid - 1;
					return;
				}
				if (!item.classList.contains('option-list-item')) return;
				item.parentElement.removeChild(item);
			});
			cfgList.splice(id, 1);
		} else if (key === '__ArrayItem__') {
			cfgList[id] = value;
		} else {
			let item = cfgList[id];
			if (!item) return;
			item[key] = value;
		}
		ChangeConfig(target, cfgList);
	};
	ele.addEventListener('change', evt => {
		var target = evt.target;
		var itemID = target.dataset.id;
		if (!itemID) return;
		var name = target.name || target.getAttribute('name');
		if (!name || name.length === 0) {
			if (isString(target.getAttribute('arrayItem'))) name = '__ArrayItem__';
			else return;
		}
		var value;
		if (target.type.toLowerCase() === 'checkbox') value = target.checked;
		else value = target.innerText || target.value;

		onChange(itemID, name, value);
	});
	ele.addEventListener('click', evt => {
		var target = evt.target;
		if (target.classList.contains('option-title')) {
			let ui = newEle('div', 'option-list-item');
			ui.innerHTML = template;
			ele.appendChild(ui);
			let index = cfgList.length;
			cfgList.push({});
			ui.querySelectorAll('[name]').forEach(line => line.dataset.id = index);
			ui.querySelectorAll('[arrayItem]').forEach(line => line.dataset.id = index);
			ui.querySelectorAll('button').forEach(btn => btn.dataset.id = index);
			return;
		}

		var next = target.target || target.getAttribute('target');
		if (!!next) {
			let ui = target.parentElement.querySelector('input[name=' + next + ']')
			if (ui.type === 'checkbox') {
				ui.checked = !ui.checked;
			} else {
				ui.focus();
			}
			target = ui;
		} else if (target.tagName.toLowerCase() !== 'button') return;
		var itemID = target.dataset.id;
		if (!itemID) return;
		var name = target.name || target.getAttribute('name') || target.getAttribute('event');
		if (!name || name.length === 0) {
			if (isString(target.getAttribute('arrayItem'))) name = '__ArrayItem__';
			else return;
		}
		var value;
		if (target.type.toLowerCase() === 'checkbox') value = target.checked;
		else value = target.innerText || target.value;

		onChange(itemID, name, value);
	});

	ExtInitActions[target] = value => {
		value = value || [];
		cfgList = value;
		value.forEach((item, index) => {
			var ui = newEle('div', 'option-list-item');
			ui.innerHTML = template;
			ui.dataset.id = index;
			ele.appendChild(ui);
			if (item instanceof Array) {
				let line = ui.querySelector('[arrayItem]')
				line.dataset.id = index;
				if (line.tagName.toLowerCase() === 'input') {
					if (line.type.toLowerCase() === 'checkbox') {
						line.checked = item || false;
					} else {
						line.value = item || '';
					}
				} else {
					line.innerText = item || '';
				}
			} else {
				ui.querySelectorAll('[name]').forEach(line => {
					line.dataset.id = index;
					var key = line.name || line.getAttribute('name');
					if (line.tagName.toLowerCase() === 'input') {
						if (line.type.toLowerCase() === 'checkbox') {
							line.checked = item[key] || false;
						} else {
							line.value = item[key] || '';
						}
					} else {
						line.innerText = item[key] || '';
					}
				});
			}
			ui.querySelectorAll('button').forEach(btn => btn.dataset.id = index);
		});
	};	
});
document.querySelectorAll('div.option-checkbox').forEach(ele => {
	var checkbox = ele.querySelector('input');
	var itemName = checkbox.name;
	var hooker = checkbox.getAttribute('hooker');
	var useHooker = isString(hooker);

	if (!useHooker) ExtInitActions[itemName] = value => checkbox.checked = value;
	var callback = () => {
		if (useHooker) {
			let cb = window.PageActions[hooker];
			if (!!cb) cb(itemName, checkbox.checked);
		}
		else ChangeConfig(itemName, checkbox.checked);
	};

	ele.querySelectorAll('label').forEach(label => {
		label.addEventListener('click', () => {
			checkbox.checked = !checkbox.checked;
			callback();
		});
	});
	checkbox.addEventListener('click', callback);
});
document.querySelectorAll('div.option-inputer').forEach(ele => {
	var inputter = ele.querySelector('input');
	var itemName = inputter.name;
	var isNum = inputter.type === 'number';
	ExtInitActions[itemName] = value => inputter.value = value;

	var change = () => {
		var value = inputter.value;
		if (isNum) {
			value = value * 1;
			if (!isNumber(value)) value = inputter.value;
		}
		ChangeConfig(itemName, value);
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
document.querySelectorAll('div.option-switcher').forEach(ele => {
	var target = ele.getAttribute('target');
	if ([undefined, null].includes(target)) return;

	var currAction = ele.getAttribute('action');

	var group = ele.getAttribute('group');
	group = group || 'default';

	var targetEle = document.querySelector('div.option-switch-container[group=' + group + '][name=' + target + ']');
	if (!targetEle) targetEle = document.querySelector('div.option-switch-container[name=' + target + ']');
	if (!targetEle) return;
	target = targetEle;
	targetEle = null;

	var nextAction = target.getAttribute('action');

	var toggleSwitcher = () => {
		ToggleAction(currAction);
		target.classList.remove('hidden');
		target.classList.add('shown');
		ToggleAction(nextAction);
	};
	var checked = ![undefined, null].includes(ele.getAttribute('checked'));
	if (checked) toggleSwitcher();

	ele.addEventListener('click', () => {
		var prev = document.querySelector('div.option-switch-container.shown[group=' + group + ']');
		if (!prev) prev = document.querySelector('div.option-switch-container.shown');
		if (!!prev && prev !== target) {
			prev.classList.remove('shown');
			prev.classList.add('hidden');
		}
		toggleSwitcher();
	});
});
document.querySelectorAll('div.option-button').forEach(ele => {
	var hooker = ele.getAttribute('hooker');
	if (!hooker || hooker.length === 0) return;
	ele.addEventListener('click', () => {
		var cb = window.PageActions[hooker];
		if (!cb) return;
		cb();
	});
});