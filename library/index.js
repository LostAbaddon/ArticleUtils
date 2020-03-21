const ArticleContainer = document.querySelector('#ArticleContainer');

const Responsers = {};

Responsers.GetArticleList = list => {
	list = Object.keys(list).map(id => list[id]);
	list.sort((ia, ib) => ib.update - ia.update);
	list.forEach(item => {
		var ele = newEle('div', 'article-item');
		ele.setAttribute('aid', item.id);
		var temp = newEle('div', 'article-title');
		temp.innerText = item.title;
		ele.appendChild(temp);
		temp = newEle('div', 'article-desc');
		temp.innerText = item.description;
		ele.appendChild(temp);
		temp = newEle('div', 'edit-article');
		temp.setAttribute('aid', item.id);
		temp.innerText = "修改";
		ele.appendChild(temp);
		ArticleContainer.appendChild(ele);
	});
};

const onClick = evt => {
	var ele = evt.target;
	var articleID = ele.getAttribute('aid');
	if (!articleID) return;
	if (ele.classList.contains('edit-article')) {
		location.href = '../markup/editor.html?id=' + articleID;
	}
	else {
		location.href = './view.html?id=' + articleID;
	}
};
const addFile = () => {
	location.href = '../markup/editor.html?action=NewFile';
};

ArticleContainer.addEventListener('click', onClick);
document.querySelector('#AddNewFile').addEventListener('click', addFile);

chrome.runtime.onMessage.addListener(msg => {
	var cb = Responsers[msg.event];
	if (!!cb) cb(msg.data);
});

chrome.runtime.sendMessage({ event: 'GetArticleList' });