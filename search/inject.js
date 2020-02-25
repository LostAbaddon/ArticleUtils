class SearchItem {
	name;
	pad;
	#title;
	#btn;
	#list = [];
	#collapsed = false;

	constructor (title) {
		this.name = title;

		this.pad = newEle('div', 'search_item_pad');

		this.#title = newEle('div', 'search_item_pad_captain');
		this.#title.innerText = title;
		this.#title.name = title;

		this.#btn = newEle('div', 'search_item_pad_collapser');
		this.#btn.innerText = '-';
		this.#title.appendChild(this.#btn);

		this.pad.appendChild(this.#title);
	}
	setContent (content) {
		content.forEach(item => {
			var ui = newEle('div', 'search_item_pad_line');
			var link = newEle('a');
			link.innerText = item[0];
			link.href = item[1];
			link.target = '_blank';
			ui.appendChild(link);
			this.pad.appendChild(ui);
			this.#list.push(ui);
		});
	}
	suicide () {
		this.#title.removeChild(this.#btn);
		this.pad.removeChild(this.#title);
		this.#list.forEach(ui => this.pad.removeChild(ui));

		this.#list.splice(0, this.#list.length);
		this.#title = null;
		this.#btn = null;
		this.pad = null;
	}
	toggle () {
		this.#collapsed = !this.#collapsed;
		if (this.#collapsed) {
			this.#btn.innerText = '+';
			this.pad.classList.add('collapsed');
		} else {
			this.#btn.innerText = '-';
			this.pad.classList.remove('collapsed');
		}
	}
}
class SearchFrame {
	frame;
	tab;
	content;
	itemList = [];
	show = false;
	#using = false;
	toggleCB;

	constructor (id, title, index) {
		this.frame = newEle('div', 'search_item_frame collapsed');

		this.tab = newEle('div', 'search_item_tab disabled tab_' + index);
		this.tab.captain = newEle('div', 'search_item_captain');
		this.tab.captain.innerText = title.split('').join('\n');
		this.tab.appendChild(this.tab.captain);
		this.tab.addEventListener('click', () => {
			this.show = !this.show;
			if (this.show) this.frame.classList.remove('collapsed');
			else this.frame.classList.add('collapsed');
			this.toggleCB(id, this.show);
		});
		this.frame.appendChild(this.tab);

		this.content = newEle('div', 'search_item_content');
		this.frame.appendChild(this.content);

		this.frame.addEventListener('click', evt => {
			var ele = evt.target;
			if (!ele || !ele.classList) return;
			if (!ele.classList.contains('search_item_pad_captain')) return;
			ele = this.itemList.filter(item => item.name === ele.name)[0];
			if (!ele) return;
			ele.toggle();
		});

		document.body.appendChild(this.frame);
	}
	collapse (showing) {
		this.show = false;
		if (showing) {
			this.frame.classList.remove('collapsed');
			this.frame.classList.add('occupied');
		} else {
			this.frame.classList.remove('occupied');
			this.frame.classList.add('collapsed');
		}
	}
	onToggle (callback) {
		this.toggleCB = callback;
	}
	clear () {
		this.itemList.forEach(item => {
			this.content.removeChild(item.pad);
			item.suicide();
		});
		this.content.innerHTML = '';
		this.itemList.splice(0, this.itemList.length);
	}
	setContent (content) {
		this.clear();
		Object.keys(content).forEach(name => {
			var list = content[name];
			if (list.length === 0) return;
			var item = new SearchItem(name);
			item.setContent(list);
			this.content.appendChild(item.pad);
			this.itemList.push(item);
		});
	}
	set using (value) {
		if (value !== true && value !== false) return;
		this.#using = value;
		if (value) {
			this.tab.classList.remove('disabled');
		} else {
			this.tab.classList.add('disabled');
		}
	}
	get using () {
		return this.#using;
	}
}

window.SearchInjection = {};
window.SearchInjection._initialed = false;
window.SearchInjection.init = tabs => {
	if (!SearchInjection._initialed) {
		let style = newEle('link');
		style.rel = 'stylesheet';
		style.href = chrome.extension.getURL('/search/inject.css');
		document.body.appendChild(style);
		SearchInjection._initialed = true;
	}

	window.SearchInjection.tabs = window.SearchInjection.tabs || {};
	tabs.forEach(tab => {
		if (!!window.SearchInjection.tabs[tab.id]) return;
		var frame = new SearchFrame(tab.id, tab.name, Object.keys(window.SearchInjection.tabs).length + 1);
		window.SearchInjection.tabs[tab.id] = frame;
		frame.onToggle((id, show) => {
			Object.keys(window.SearchInjection.tabs).forEach(tab => {
				if (tab === id) return;
				tab = window.SearchInjection.tabs[tab];
				tab.collapse(show);
			});
		});
	});
};
window.SearchInjection.show = resource => {
	var used = [];
	Object.keys(resource).forEach(type => {
		var list = resource[type];
		if (!list) return;
		var len = 0;
		Object.keys(list).forEach(name => {
			var res = list[name];
			if (!res) return;
			if (!res.length) return;
			len += res.length;
		})
		if (len === 0) return;
		used.push(type);
		var tab = window.SearchInjection.tabs[type];
		if (!!tab) tab.using = true;

		tab.setContent(list);
	});
	Object.keys(window.SearchInjection.tabs).forEach(tab => {
		if (used.includes(tab)) return;
		tab = window.SearchInjection.tabs[tab];
		tab.using = false;
		tab.clear();
	});
};