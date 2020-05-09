/**
 *	Title: MarkUp Parser Extensions
 *	Author: LostAbaddon
 *	Email: LostAbaddon@gmail.com
 *	Version: 1.0.0
 *	Date: 2020.03.18
 */

const generateRandomKey = MarkUp.generateRandomKey;

// LaTeX
MarkUp.addExtension({
	name: 'LaTeX',
	parse: (line, doc, caches) => {
		caches[MarkUp.SymHidden] = caches[MarkUp.SymHidden] || {};
		var changed = false;
		line = line.replace(/(\\+)\$/g, (match, slash) => {
			var len = Math.floor(slash.length / 2);
			var result = '';
			var meta = '%' + MarkUp.PreserveWords['\\'] + '%';
			for (let i = 0; i < len; i ++) result += meta
			if (len * 2 !== slash.length) {
				let word = MarkUp.PreserveWords['$'];
				result += '%' + word + '%';
			} else {
				result += '$';
			}
			changed = true;
			return result;
		});
		line = line.replace(/\$([\w\W]+?)\$/g, (match, content) => {
			if (match.indexOf('$$') >= 0) return match;
			var key = 'latex-' + generateRandomKey();
			caches[MarkUp.SymHidden][key] = '<span class="latex inline">$' + content + '$</span>';
			changed = true;
			return '%' + key + '%';
		});
		return [line, changed];
	},
}, 0, -1);

// FA 图标
MarkUp.addExtension({
	name: 'FontAwesome',
	parse: (line, doc, caches) => {
		var changed = false;

		line = line.replace(/:([\w\-\.]+?):/g, (match, name, pos) => {
			name = name.trim();
			changed = true;
			return '<i class="fas far fa-' + name + '"></i>'
		});
		return [line, changed];
	},
}, 0, 3);
// 超链接
MarkUp.addExtension({
	name: 'HyperLinks',
	parse: (line, doc, caches) => {
		doc.links = doc.links || [];
		var changed = false;
		line = line.replace(/([!@#]?)\[([\w %'"\*_\^\|~\-\.\+=·,;:\?!\\\/&\u0800-\uffff]*?)\] *\((\@?[\w\W]*?)\)/g, (match, prev, title, link, pos) => {
			link = link.trim();
			if (link.length === 0) return match;
			if (!!caches[title]) return match;

			if (prev === '') {
				doc.links.push([title, link]);
				let isInner = link.substr(0, 1) === '@';
				let content = MarkUp.parseLine(title, doc, 3, caches);
				let key = 'link-' + generateRandomKey();
				let ui = '<a href="';
				if (isInner) {
					ui = ui + '#' + link.substr(1, link.length) + '">';
				}
				else {
					ui = ui + link + '" target="_blank">';
				}
				ui = ui + content + '</a>';
				caches[key] = ui;
				changed = true;
				return '%' + key + '%';
			}
			return match;
		});
		return [line, changed];
	},
}, 0, 3);
// 锚点与术语
MarkUp.addExtension({
	name: 'AnchorAndTerm',
	parse: (line, doc, caches) => {
		var changed = false;

		line = line.replace(/\[([\w %'"\-\.\+=,;:\?!\\\/&\u0800-\uffff]*?)\] *\{([\w \-\.]+?)\}/g, (match, title, name, pos) => {
			name = name.trim();
			title = title.trim();
			if (name.length === 0) return match;
			if (title.length === 0) return match;
			if (!!caches[title]) return match;

			var content = MarkUp.parseLine(title, doc, 3, caches), key;

			if (!!doc.refs[name]) {
				// 有定义，所以是术语
				key = 'term-' + generateRandomKey();
				doc.termList = doc.termList || [];
				doc.termList.push([name, title]);
				doc.termList[name] = title;
				let ui = '<a class="terminology" name="' + name + '" href="#ref-' + name + '"><strong>' + title + '</strong></a>';
				caches[key] = ui;
			}
			else {
				// 无定义，所以只是一个锚点
				key = 'anchor-' + generateRandomKey();
				let ui = '<a name="' + name + '">' + title + '</a>';
				caches[key] = ui;
			}
			changed = true;
			return '%' + key + '%';
		});
		return [line, changed];
	},
}, 0, 3);

// Code
MarkUp.addExtension({
	name: 'Code',
	parse: (line, doc, caches) => {
		caches[MarkUp.SymHidden] = caches[MarkUp.SymHidden] || {};
		var changed = false;
		line = line.replace(/`([\w\W]+?)`/g, (match, content) => {
			if (match.indexOf('``') >= 0) return match;
			var key = 'code-' + generateRandomKey();
			caches[MarkUp.SymHidden][key] = '<code>' + content + '</code>';
			changed = true;
			return '%' + key + '%';
		});
		return [line, changed];
	},
});
// 粗体与斜体
MarkUp.addExtension({
	name: 'BoldAndItalic',
	parse: (line, doc, caches) => {
		var locs = [];
		line.replace(/\*+/g, (match, pos) => {
			locs.push([pos, match.length]);
		});
		if (locs.length < 2) return [line, false];

		var generate = (start, end, isBold) => {
			var part = line.substring(start, end + (isBold ? 2 : 1));
			var inner;
			if (isBold) inner = part.substring(2, part.length - 2);
			else inner = part.substring(1, part.length - 1);
			var key = (isBold ? 'strong' : 'em') + '-' + generateRandomKey();
			inner = MarkUp.parseLine(inner, doc, 5, caches);
			if (isBold) {
				caches[key] = '<strong>' + inner + '</strong>';
			}
			else {
				caches[key] = '<em>' + inner + '</em>';
			}
			key = '%' + key + '%';
			line = line.replace(part, key);
		};

		var first = locs[0][1], second = locs[1][1];
		if (first < 3) {
			// 如果开头非联合
			if (first === second) {
				generate(locs[0][0], locs[1][0], first === 2);
				return [line, true];
			}
			else if (second < 3) {
				let third = locs[2];
				if (!third) {
					if (first > second) {
						generate(locs[0][0] + 1, locs[1][0], false);
						return [line, true];
					}
					else {
						generate(locs[0][0], locs[1][0], false);
						return [line, true];
					}
				} else {
					third = third[1];
					if (third < 3) {
						if (second === third) {
							generate(locs[1][0], locs[2][0], second === 2);
							return [line, true];
						}
						else if (first === third) {
							generate(locs[0][0], locs[2][0], first === 2);
							return [line, true];
						}
						else {
							return [line, false];
						}
					}
					else {
						generate(locs[1][0], locs[2][0], second === 2);
						return [line, true];
					}
				}
			}
			else {
				generate(locs[0][0], locs[1][0], first === 2);
				return [line, true];
			}
		} else {
			// 开头联合
			if (second < 3) {
				if (second === 1) {
					generate(locs[0][0] + first - 1, locs[1][0], false);
					return [line, true];
				} else {
					generate(locs[0][0] + first - 2, locs[1][0], true);
					return [line, true];
				}
			}
			else {
				generate(locs[0][0], locs[1][0] + second - 2, true);
				return [line, true];
			}
		}
		return [line, false];
	},
});
// 下标与下划线
MarkUp.addExtension({
	name: 'SubAndUnderline',
	parse: (line, doc, caches) => {
		var locs = [];
		line.replace(/_+/g, (match, pos) => {
			locs.push([pos, match.length]);
		});
		if (locs.length < 2) return [line, false];

		var generate = (start, end, isUnder) => {
			var part = line.substring(start, end + (isUnder ? 2 : 1));
			var inner;
			if (isUnder) inner = part.substring(2, part.length - 2);
			else inner = part.substring(1, part.length - 1);
			var key = (isUnder ? 'underline' : 'sub') + '-' + generateRandomKey();
			inner = MarkUp.parseLine(inner, doc, 5, caches);
			if (isUnder) {
				caches[key] = '<u>' + inner + '</u>';
			}
			else {
				caches[key] = '<sub>' + inner + '</sub>';
			}
			key = '%' + key + '%';
			line = line.replace(part, key);
		};

		var first = locs[0][1], second = locs[1][1];
		if (first < 3) {
			// 如果开头非联合
			if (first === second) {
				generate(locs[0][0], locs[1][0], first === 2);
				return [line, true];
			}
			else if (second < 3) {
				let third = locs[2];
				if (!third) {
					if (first > second) {
						generate(locs[0][0] + 1, locs[1][0], false);
						return [line, true];
					}
					else {
						generate(locs[0][0], locs[1][0], false);
						return [line, true];
					}
				} else {
					third = third[1];
					if (third < 3) {
						if (second === third) {
							generate(locs[1][0], locs[2][0], second === 2);
							return [line, true];
						}
						else if (first === third) {
							generate(locs[0][0], locs[2][0], first === 2);
							return [line, true];
						}
						else {
							return [line, false];
						}
					}
					else {
						generate(locs[1][0], locs[2][0], second === 2);
						return [line, true];
					}
				}
			}
			else {
				generate(locs[0][0], locs[1][0], first === 2);
				return [line, true];
			}
		} else {
			// 开头联合
			if (second < 3) {
				if (second === 1) {
					generate(locs[0][0] + first - 1, locs[1][0], false);
					return [line, true];
				} else {
					generate(locs[0][0] + first - 2, locs[1][0], true);
					return [line, true];
				}
			}
			else {
				generate(locs[0][0], locs[1][0] + second - 2, true);
				return [line, true];
			}
		}
		return [line, false];
	},
});
// 波浪线与删除线
MarkUp.addExtension({
	name: 'WavyAndDelete',
	parse: (line, doc, caches) => {
		var locs = [];
		line.replace(/~+/g, (match, pos) => {
			locs.push([pos, match.length]);
		});
		if (locs.length < 2) return [line, false];

		var generate = (start, end, isDelete) => {
			var part = line.substring(start, end + (isDelete ? 2 : 1));
			var inner;
			if (isDelete) inner = part.substring(2, part.length - 2);
			else inner = part.substring(1, part.length - 1);
			var key = (isDelete ? 'delete' : 'wavy') + '-' + generateRandomKey();
			inner = MarkUp.parseLine(inner, doc, 5, caches);
			if (isDelete) {
				caches[key] = '<del>' + inner + '</del>';
			}
			else {
				caches[key] = '<span class="text-wavy">' + inner + '</span>';
			}
			key = '%' + key + '%';
			line = line.replace(part, key);
		};

		var first = locs[0][1], second = locs[1][1];
		if (first < 3) {
			// 如果开头非联合
			if (first === second) {
				generate(locs[0][0], locs[1][0], first === 2);
				return [line, true];
			}
			else if (second < 3) {
				let third = locs[2];
				if (!third) {
					if (first > second) {
						generate(locs[0][0] + 1, locs[1][0], false);
						return [line, true];
					}
					else {
						generate(locs[0][0], locs[1][0], false);
						return [line, true];
					}
				} else {
					third = third[1];
					if (third < 3) {
						if (second === third) {
							generate(locs[1][0], locs[2][0], second === 2);
							return [line, true];
						}
						else if (first === third) {
							generate(locs[0][0], locs[2][0], first === 2);
							return [line, true];
						}
						else {
							return [line, false];
						}
					}
					else {
						generate(locs[1][0], locs[2][0], second === 2);
						return [line, true];
					}
				}
			}
			else {
				generate(locs[0][0], locs[1][0], first === 2);
				return [line, true];
			}
		} else {
			// 开头联合
			if (second < 3) {
				if (second === 1) {
					generate(locs[0][0] + first - 1, locs[1][0], false);
					return [line, true];
				} else {
					generate(locs[0][0] + first - 2, locs[1][0], true);
					return [line, true];
				}
			}
			else {
				generate(locs[0][0], locs[1][0] + second - 2, true);
				return [line, true];
			}
		}
		return [line, false];
	},
});
// 上标与更大
MarkUp.addExtension({
	name: 'SupAndLarger',
	parse: (line, doc, caches) => {
		var generate = (start, end, level) => {
			var part = line.substring(start, end + level);
			var inner = part.substring(level, part.length - level);
			var key = 'larger-' + level + '-' + generateRandomKey();
			inner = MarkUp.parseLine(inner, doc, 5, caches);
			if (level <= 1) {
				caches[key] = '<sup>' + inner + '</sup>';
			}
			else {
				caches[key] = '<span class="text-larger level-' + (level - 1) + '">' + inner + '</span>';
			}
			key = '%' + key + '%';
			line = line.replace(part, key);
		};

		var changed = false;
		line.replace(/(\^+)([\w\W]+?)(\^+)/, (match, pre, content, post, pos) => {
			var checker = content.match(/(\\*)\[/);
			if (!!checker) {
				let len = checker[1].length;
				if (len >> 1 << 1 === len) return match;
			}
			pre = pre.length;
			post = post.length;
			if (pre > post) {
				generate(pos + pre - post, pos + match.length - post, post);
			}
			else {
				generate(pos, pos + match.length - post, pre);
			}
			changed = true;
			return match;
		});
		return [line, changed];
	},
});

// 颜色
MarkUp.addExtension({
	name: 'Color',
	parse: (line, doc, caches) => {
		var changed = false;

		line = line.replace(/\[(\w+)\]([\w\W]+?)\[\/\]/, (match, color, content, pos) => {
			if (content.length === 0) return match;

			content = MarkUp.parseLine(content, doc, 5, caches);
			var key = 'color-' + generateRandomKey();
			caches[key] = '<span class="color-' + color + '">' + content + '</span>';
			changed = true;
			return '%' + key + '%';
		});
		return [line, changed];
	},
}, 0, 6);
// 脚注与尾注
MarkUp.addExtension({
	name: 'FootnoteAndEndnote',
	parse: (line, doc, caches) => {
		var changed = false;

		line = line.replace(/(\[([\w %'"\-\.\+=,;:\?!\\\/&\u0800-\uffff]*?)\])?\[([\^:])([\w \-\.]+?)\]/g, (match, all, title='', prefix, name) => {
			name = name.trim();
			if (name.length === 0) return match;
			if (!doc.refs[name]) return match;

			var ui = '<a class="notemark" type="';
			if (prefix === '^') {
				ui += 'endnote" href="#endnote-' + name
			}
			else {
				ui += 'footnote'
			}
			ui += '" name="' + name + '">';
			if (title) {
				ui = ui + MarkUp.parseLine(title, doc, 6, caches);
			}
			ui += '<sup>'
			if (prefix === '^') { // 尾注
				doc.endnotes = doc.endnotes || [];
				let i = doc.endnotes.indexOf(name);
				if (i < 0) {
					i = doc.endnotes.length;
					doc.endnotes.push(name);
				}
				i ++;
				ui += '(' + i + ')';
			}
			else { // 脚注
				doc.footnotes = doc.footnotes || [];
				let i = doc.footnotes.indexOf(name);
				if (i < 0) {
					i = doc.footnotes.length;
					doc.footnotes.push(name);
				}
				ui += '[%%FN-' + i + '%%]';
			}
			ui += '</sup></a>';
			var key = 'notemark-' + generateRandomKey();
			caches[key] = ui;
			return '%' + key + '%'
		});
		return [line, changed];
	},
}, 0, 6);

// 图片等资源
MarkUp.addExtension({
	name: 'HyperLinks',
	parse: (line, doc, caches) => {
		var changed = false;

		line = line.replace(/([!@#])\[([^\n]*?)\] *\((\@?[\w\W]*?)\)/g, (match, prev, title, link, pos) => {
			link = link.trim();
			if (link.length === 0) return match;

			var float = link.match(/[ 　\t]+"(left|right)"/);
			if (!!float) {
				link = link.replace(float[0], '');
				float = float[1];
			}

			var type = 'image';
			if (prev === '@') type = 'video';
			else if (prev === '#') type = 'audio';
			doc[type] = doc[type] || [];
			doc[type].push([title, link]);

			var content = '<div class="resource ' + type;
			if (!!float) {
				content += ' float-' + float;
			}
			content += '">';
			content += '<figure>';
			if (prev === '!') {
				content += '<img src="' + link + '">';
			}
			else if (prev === '@') {
				content += '<video src="' + link + '" controls>你的浏览器不支持 <code>video</code> 标签.</video>';
			}
			else if (prev === '#') {
				content += '<audio src="' + link + '" controls>你的浏览器不支持 <code>audio</code> 标签.</audio>';
			}
			content += '</figure>';
			content += '<figcaption>' + title + '</figcaption>';
			content += '</div>';

			var key = type + '-' + generateRandomKey();
			caches[key] = content;
			changed = true;
			return '%' + key + '%';
		});
		return [line, changed];
	},
}, 0, 7);

// URL 格式解析
MarkUp.addExtension({
	name: 'InlineLinks',
	parse: (line, doc, caches) => {
		var changed = false;
		if (!doc.mainParser) return [line, changed];

		line = line.replace(/https?:\/\/[\w\-\+=\.;\?\\\/%]+/gi, (match, pos) => {
			doc.links.push([match, match]);
			var ui = '<a href="' + match + '" target="_blank">' + match + '</a>';
			var key = 'link-' + generateRandomKey();
			caches[key] = ui;
			changed = true;
			return '%' + key + '%';
		});
		return [line, changed];
	},
}, 0, 8);