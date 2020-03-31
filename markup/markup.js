/**
 *	Title: MarkUp Parser
 *	Author: LostAbaddon
 *	Email: LostAbaddon@gmail.com
 *	Version: 1.0.0
 *	Date: 2020.03.18
 */

(() => {
	const SymHidden = Symbol('HIDDEN');
	const MetaWords = ['GOD', 'THEONE', 'TITLE', 'AUTHOR', 'EMAIL', 'DESCRIPTION', 'STYLE', 'SCRIPT', 'DATE', 'KEYWORD', 'GLOSSARY', 'TOC', 'REF', 'LINK', 'IMAGES', 'VIDEOS', 'AUDIOS', 'ARCHOR', 'SHOWTITLE', 'SHOWAUTHOR', 'RESOURCES'];
	const PreservedKeywords = ['toc', 'glossary', 'resources', 'images', 'videos', 'audios'];
	const ParagraphTags = ['article', 'section', 'div', 'p', 'header', 'footer', 'aside', 'ul', 'ol', 'li', 'blockquote', 'pre', 'figure', 'figcaption'];

	const PreserveWords = {
		'\\': 'slash',
		'/': 'antislash',
		'_': 'underline',
		'*': 'star',
		'+': 'plus',
		'-': 'minus',
		'=': 'equal',
		'`': 'dash',
		'~': 'wavy',
		'!': 'bang',
		'?': 'question',
		':': 'colon',
		'@': 'at-circle',
		'#': 'sharp',
		'^': 'angle',
		'$': 'dollar',
		'%': 'percent',
		'(': 'left-bracket',
		')': 'right-bracket',
		'[': 'left-square-bracket',
		']': 'right-square-bracket',
		'{': 'left-curve-bracket',
		'}': 'right-curve-bracket',
		'|': 'vertical-line',
	};
	const ReversePreserveWords = {};
	Object.keys(PreserveWords).forEach(key => ReversePreserveWords[PreserveWords[key].toLowerCase()] = key);
	ReversePreserveWords['$'] = '&#36;';
	MetaWords.forEach((w, i) => MetaWords[i] = w.toLowerCase());

	const MarkUp = {};
	const LineRender = {}; // Level 小于 0 的不做保留字替换，从 0 开始作保留字替换
	const BlockRender = {}; // 主体处理结束后的后续处理插件
	const FinalRender = {}; // 主体处理结束后的后续处理插件

	const generateRandomKey = () => {
		var result = '';
		for (let i = 0; i < 8; i ++) {
			result += Math.floor(Math.random() * 10) + '';
		}
		return result;
	};

	MarkUp.addExtension = (ext, isInline=0, level=5) => {
		if (isInline === 0) {
			let indexes = LineRender['_indexes_'];
			if (!indexes) {
				indexes = [];
				LineRender['_indexes_'] = indexes;
			}
			if (!indexes.includes(level)) {
				indexes.push(level);
				indexes.sort((a, b) => a - b);
			}
			indexes = LineRender[level];
			if (!indexes) {
				indexes = [];
				LineRender[level] = indexes;
			}
			indexes.push(ext);
		}
		else if (isInline === 1) {
			let indexes = BlockRender['_indexes_'];
			if (!indexes) {
				indexes = [];
				BlockRender['_indexes_'] = indexes;
			}
			if (!indexes.includes(level)) {
				indexes.push(level);
				indexes.sort((a, b) => a - b);
			}
			indexes = BlockRender[level];
			if (!indexes) {
				indexes = [];
				BlockRender[level] = indexes;
			}
			indexes.push(ext);
		}
		else if (isInline === 2) {
			let indexes = FinalRender['_indexes_'];
			if (!indexes) {
				indexes = [];
				FinalRender['_indexes_'] = indexes;
			}
			if (!indexes.includes(level)) {
				indexes.push(level);
				indexes.sort((a, b) => a - b);
			}
			indexes = FinalRender[level];
			if (!indexes) {
				indexes = [];
				FinalRender[level] = indexes;
			}
			indexes.push(ext);
		}
	};

	// 准备文档，进行必要的预处理
	const prepare = text => {
		text = '\n' + text + '\n';
		text = text.replace(/\r\n/g, '\n').replace(/\n([ 　]+)/g, (match, spaces) => {
			var len = spaces.replace(/　/g, '  ').length;
			if (len < 4) return '\n';
			else return match;
		});
		text = text.replace(/(\n[ 　\t>\-\+\*~(\d+\.)]+)(`{3,}|~{3,}|\${2})/g, (match, pre, post) => {
			return pre + '\n' + post;
		});
		MetaWords.forEach(key => {
			var reg = new RegExp('([\\w\\W]? *)\\[' + key + '\\]( *[\\w\\W]?)', 'gi');
			text = text.replace(reg, (match, pre, post) => {
				if (pre === ']' || post === '[' || post === '(') return match;
				return pre + '%' + key + '%' + post;
			});
		});
		return text;
	};

	// 规整文档
	const regularize = text => {
		text = text.replace(/^\n+|\n+$/gi, '');
		text = text.replace(/\n{3,}/gi, '\n\n\n');
		return text;
	};

	// 解析段内样式
	const parseLine = (line, doc, currLevel=-Infinity, caches) => {
		var indexes = LineRender['_indexes_'];
		if (!indexes) return '';

		var outmost = !caches;
		caches = caches || {}
		indexes.some(level => {
			if (currLevel > level) return true;
			if (level >= 0) return true;
			var exts = LineRender[level], changed = true;
			while (changed) {
				changed = false;
				exts.forEach(ext => {
					var c;
					[line, c] = ext.parse(line, doc, caches);
					if (c) changed = true;
				});
			}
		});

		line = convertPreserves(line);

		indexes.forEach(level => {
			if (currLevel > level) return;
			if (level < 0) return;
			var exts = LineRender[level], changed = true;
			while (changed) {
				changed = false;
				exts.forEach(ext => {
					var c;
					[line, c] = ext.parse(line, doc, caches);
					if (c) changed = true;
				});
			}
		});

		if (outmost) line = restorePreserves(line, caches);
		return line;
	};
	// 解析段级样式
	const parseSection = (content, doc, currLevel=0, caches) => {
		doc.parseLevel ++;

		var sections = [];

		var outmost = false;
		if (!caches) {
			outmost = true;
			caches = {};
		}

		// 先预判断每一段可能是什么
		var blocks = []; // 行号，是否空行，疑似分割线，疑似引用，疑似列表，是否代码块首尾，疑似表格，是否公式首尾
		sections = content.split('\n');
		sections.forEach((line, index) => {
			// 空行
			var head = line.match(/^[ 　\t]*$/);
			if (line.length === 0) {
				blocks.push([index, 1, 0, 0, 0, 0, 0, 0]);
				return;
			}
			// 分割线
			if (line.match(/^[=\-\+\*~\._#]{3,}$/)) {
				if (!!line.match(/^\-+$|^=+$/)) blocks.push([index, 0, 2, 0, 0, 0, 0, 0]);
				else if (!!line.match(/^~+$/)) blocks.push([index, 0, 2, 0, 0, 1, 0, 0]);
				else blocks.push([index, 0, 1, 0, 0, 0, 0, 0]);
				return;
			}
			// 代码块
			head = line.match(/^(`{3,}|~{3,})[ 　\t]*([\w\-\.\+=\?\~\\\/]*)$/);
			if (!!head) {
				if (!!head[2]) blocks.push([index, 0, 0, 0, 0, 2, 0, 0]);
				else blocks.push([index, 0, 0, 0, 0, 1, 0, 0]);
				return;
			}
			// 公式块
			head = line.match(/^\${2}[ 　\t]*$/);
			if (!!head) {
				if (!!head[2]) blocks.push([index, 0, 0, 0, 0, 0, 0, 1]);
				else blocks.push([index, 0, 0, 0, 0, 0, 0, 1]);
				return;
			}
			// 列表
			head = line.match(/^([\-\+\*~]|\d+\.)[ 　\t]+/);
			if (!!head) {
				head = line.match(/^([\-\+\*~]|\d+\.)[ 　\t]+(`{3,}|~{3,})[ 　\t]*([\w\-\.\+=\?\~\\\/]*)$/);
				if (!!head) {
					if (!!head[2]) blocks.push([index, 0, 0, 0, 1, 2, 0, 0]);
					else blocks.push([index, 0, 0, 0, 1, 1, 0, 0]);
					return;
				}
				head = line.match(/^([\-\+\*~]|\d+\.)[ 　\t]+(\${2})[ 　\t]*$/);
				if (!!head) {
					if (!!head[2]) blocks.push([index, 0, 0, 0, 1, 0, 0, 1]);
					else blocks.push([index, 0, 0, 0, 1, 0, 0, 1]);
					return;
				}
				blocks.push([index, 0, 0, 0, 1, 0, 0, 0]);
				return;
			}
			// 引用
			head = line.match(/^(> *)+/);
			if (!!head) {
				head = line.match(/^(> *)+[ 　\t]+(`{3,}|~{3,})[ 　\t]*([\w\-\.\+=\?\~\\\/]*)$/);
				if (!!head) {
					if (!!head[2]) blocks.push([index, 0, 0, 1, 0, 2, 0, 0]);
					else blocks.push([index, 0, 0, 1, 0, 1, 0, 0]);
					return;
				}
				head = line.match(/^(> *)+[ 　\t]+(\${2})[ 　\t]*$/);
				if (!!head) {
					if (!!head[2]) blocks.push([index, 0, 0, 1, 0, 0, 0, 1]);
					else blocks.push([index, 0, 0, 1, 0, 0, 0, 1]);
					return;
				}
				blocks.push([index, 0, 0, 1, 0, 0, 0, 0]);
				return;
			}
			// 引用与列表都有可能
			head = line.match(/^([ 　\t]+)/);
			if (!!head) {
				head = line.match(/(`{3,}|~{3,})[ 　\t]*([\w\-\.\+=\?\~\\\/]*)$/);
				if (!!head) {
					if (!!head[1]) blocks.push([index, 0, 0, 1, 1, 2, 0, 0]);
					else blocks.push([index, 0, 0, 1, 1, 1, 0, 0]);
					return;
				}
				head = line.match(/(\${2})[ 　\t]*([\w\-\.\+=\?\~\\\/]*)$/);
				if (!!head) {
					if (!!head[1]) blocks.push([index, 0, 0, 1, 1, 0, 0, 1]);
					else blocks.push([index, 0, 0, 1, 1, 0, 0, 1]);
					return;
				}
				blocks.push([index, 0, 0, 1, 1, 0, 0, 0]);
				return;
			}
			// 表格
			head = line.match(/\|/g);
			if (!!head) {
				let ctx = line.match(/\\\|/g);
				if (!ctx || (!!ctx && ctx.length !== head.length)) {
					let has = true;
					ctx = line;
					while (has) {
						has = false;
						let x = ctx.replace(/\([^\(\)\[\]\{\}]+?\)/g, '');
						x = x.replace(/\[[^\(\)\[\]\{\}]+?\]/g, '');
						x = x.replace(/\{[^\(\)\[\]\{\}]+?\}/g, '');
						has = (x !== ctx);
						ctx = x;
					}
					if (ctx.indexOf('|') >= 0) {
						blocks.push([index, 0, 0, 0, 0, 0, 1, 0]);
						return;
					}
				}
			}
		});
		var blockMap = {};
		blocks.forEach(line => {
			blockMap[line[0]] = line;
		});

		var changed = true;
		changed = false;

		if (blocks.length > 0) {
			// LaTeX 数学公式
			changed = parseLaTeX(blocks, blockMap, sections, doc, caches) || changed;

			// 处理独立代码块，引用、列表与表格中的代码块稍后处理
			if (blocks.length > 0) changed = parseCodeBlock(blocks, blockMap, sections, doc, caches) || changed;

			// 表格
			if (blocks.length > 0) changed = parseTable(blocks, blockMap, sections, doc, caches) || changed;

			// 插入行号
			if (outmost && currLevel === 0 && !!doc.metas.linenumber) {
				let lineID = 0;
				sections.forEach((line, id) => {
					if (!line) return;
					if (!!line.match(/^%[\w\-]+%$/)) return;
					var info = blockMap[id];
					if (!!info && (info[1] > 0 || info[2] > 0)) return; // 去除空行和分割线
					if (!!line.match(/^[ 　\t>\+\-\*`\^\|_~=\{\}<]$/)) return; //去除引用列表等中的空行
					if (!!line.match(/^[!@#]\[[^\(\)\[\]\{\}]*?(\[.*?\][ 　\t]*\(.*?\))*?[^\(\)\[\]\{\}]*?\](\([^\(\)\[\]\{\}]*?\))$/)) return; // 去除图片等资源
					if (!!line.match(/^[!@#]\[[^\(\)\[\]\{\}]*?(\[.*?\][ 　\t]*\(.*?\))*?[^\(\)\[\]\{\}]*?\](\[[^\(\)\[\]\{\}]*?\])$/)) return; // 去除图片等资源
					var tail = line.match(/\{[<\|>]\}$/);
					if (!!tail) {
						tail = tail[0];
						line = line.substr(0, line.length - tail.length) + '<span name="line-' + lineID + '"></span>' + tail;
					}
					else {
						line = line + '<span name="line-' + lineID + '"></span>';
					}
					lineID++;
					sections[id] = line;
				});
				doc.metas.totalLineCount = lineID;
			}

			// 重排内容
			[sections, blockMap] = squeezeContents(blocks, blockMap, sections);

			// 引用与列表
			if (blocks.length > 0) {
				changed = parseListAndBlockQuote(blocks, blockMap, sections, doc, caches) || changed;
				[sections, blockMap] = squeezeContents(blocks, blockMap, sections);
			}

			// 解析标题
			if (blocks.length > 0) {
				changed = parseHeadline(blocks, blockMap, sections, doc, caches) || changed;
				[sections, blockMap] = squeezeContents(blocks, blockMap, sections);
			}
		}

		// 将图移出
		changed = parseResources(blocks, blockMap, sections, doc, caches) || changed;
		[sections, blockMap] = squeezeContents(blocks, blockMap, sections);

		// 段落处理
		changed = parseParagraph(blocks, blockMap, sections, doc, caches) || changed;

		sections = sections.map(line => {
			if (line === null) return '';
			if (line === undefined) return '';
			if (line.length === 0) return '';
			var context = '';
			if (outmost) {
				let head = line.match(/^%([\w\W]+)%(\{[\w \-\.\u0800-\uffff]+\})*$/);
				if (!!head) {
					context = restorePreserves(line, caches, false);
				} else {
					context = parsePlainParaStyle(line, doc);
					context = restorePreserves(context, caches, false);
				}
			}
			else {
				context = parsePlainParaStyle(line, doc);
				let key = 'param-' + generateRandomKey();
				caches[key] = context;
				context = '%' + key + '%';
			}
			return context;
		});
		doc.parseLevel --;
		if (doc.parseLevel > 0) sections = sections.join('');
		return sections;
	};

	const squeezeContents = (blocks, blockMap, contents) => {
		contents = contents.map((line, i) => [i, line]);
		contents = contents.filter(line => {
			if (!line[1] && line[1] !== '') return false;
			return true;
		});
		contents.forEach((line, i) => {
			var j = line[0];
			var b = blockMap[j];
			if (!b) return;
			b[0] = i;
		});
		blockMap = {};
		blocks.forEach(line => {
			blockMap[line[0]] = line;
		});
		contents = contents.map(line => line[1]);
		return [contents, blockMap];
	};
	const parsePlainParaStyle = (line, doc) => {
		var prefix = '<p', postfix = '</p>', classes = [];

		// 对齐
		var align = line.match(/^\{[<\|>]\}|\{[<\|>]\}$/);
		if (!!align) {
			align = align[0];
			if (align === '{<}') {
				classes.push('align-left');
			}
			else if (align === '{|}') {
				classes.push('align-center');
			}
			else if (align === '{>}') {
				classes.push('align-right');
			}
			line = line.replace(/^\{[<\|>]\}|\{[<\|>]\}$/g, '');
		}

		// 缩进
		var indent = line.match(/^(:+)/);
		if (!!indent && !line.match(/^:([\w\-\.]+?):/)) {
			indent = indent[0];
			classes.push('indent', 'indent-' + indent.length);
			line = line.replace(/^:+/, '');
		}

		// 合成样式
		if (classes.length > 0) {
			prefix = prefix + ' class="' + classes.join(' ') + '"';
		}
		prefix = prefix + '>';

		// 解析段落
		// line = parseLine(line, doc);
		if (line.length === 0) return '';
		return prefix + line + postfix;
	};
	const parseLaTeX = (blocks, blockMap, contents, doc, caches) => {
		// 筛选出疑似独立代码块
		var equaBlocks = [];
		blocks.forEach(line => {
			if (!line[7]) return;
			equaBlocks.push(line);
		});

		if (equaBlocks.length === 0) return false;
		if (equaBlocks.length === 1) {
			equaBlocks[0][7] = 0;
			return false;
		}

		// 先分离明确知道开头的
		var total = equaBlocks.length, prev = equaBlocks[0];
		prev[7] = 2;
		for (let i = 1; i < total; i ++) {
			let curr = equaBlocks[i];
			if (prev[7] === 2) {
				curr[3] = prev[3];
				curr[4] = prev[4];
				curr[7] = 3;
			}
			else if (prev[7] === 3) curr[7] = 2;
			prev = curr;
		}
		if (equaBlocks[equaBlocks.length - 1][7] === 2) equaBlocks[equaBlocks.length - 1][7] = 0;

		// 去除无用行
		equaBlocks.forEach(line => {
			if (line[7] === 1) line[7] = 0;
		});
		var starters = [];
		equaBlocks = equaBlocks.filter(line => {
			if (line[7] < 2) return false;
			if (line[7] === 2) starters.push(line[0])
			return true;
		});

		total = equaBlocks.length;
		for (let i = total - 1; i > 0; i -= 2) {
			let j = equaBlocks[i - 1][0];
			if (!starters.includes(j)) {
				equaBlocks.splice(i - 1, 2);
			}
		}

		// 生成代码
		var equaSection = [];
		total = equaBlocks.length;
		for (let i = 0; i < total; i += 2) {
			equaSection.push([equaBlocks[i][0], equaBlocks[i + 1][0]]);
		}
		equaSection.forEach(block => {
			var ctx = ['<p class="latex block">$$'];
			for (let i = block[0] + 1; i < block[1]; i ++) {
				ctx.push(contents[i]);
			}
			ctx.push('$$</p>');
			ctx = ctx.join('<br>');

			var key = 'latex-' + generateRandomKey();
			doc.finals[key] = ctx;
			contents[block[0]] = '%' + key + '%';
			for (let i = block[0] + 1; i <= block[1]; i ++) {
				contents[i] = null;
			}
			for (let i = block[0]; i <= block[1]; i ++) {
				let line = blockMap[i];
				if (!line) continue;
				let j = blocks.indexOf(line);
				if (j >= 0) blocks.splice(j, 1);
				delete blockMap[i];
				line[0] = -1;
			}
		});

		return equaSection.length > 0;
	};
	const parseCodeBlock = (blocks, blockMap, contents, doc, caches) => {
		// 筛选出疑似独立代码块
		var codeBlocks = [];
		blocks.forEach(line => {
			if (!line[5]) return;
			codeBlocks.push(line);
		});

		if (codeBlocks.length === 0) return false;
		if (codeBlocks.length === 1) {
			codeBlocks[0][5] = 0;
			return false;
		}

		// 先分离明确知道开头的
		var total = codeBlocks.length, prev = codeBlocks[0];
		prev[5] = 2;
		for (let i = 1; i < total; i ++) {
			let curr = codeBlocks[i];
			if (curr[5] === 2) {
				if (i === total - 1) curr[5] = 0;
				if (prev[5] !== 3) {
					prev[5] = 0;
					continue;
				}
			}
			if (prev[5] === 2) {
				curr[3] = prev[3];
				curr[4] = prev[4];
				curr[5] = 3;
			}
			else if (prev[5] === 3) curr[5] = 2;
			prev = curr;
		}
		if (codeBlocks[codeBlocks.length - 1][5] === 2) codeBlocks[codeBlocks.length - 1][5] = 0;

		// 去除无用行
		codeBlocks.forEach(line => {
			if (line[5] === 1) line[5] = 0;
		});
		var starters = [];
		codeBlocks = codeBlocks.filter(line => {
			if (line[5] < 2) return false;
			if (line[5] === 2) starters.push(line[0])
			return true;
		});

		total = codeBlocks.length;
		for (let i = total - 1; i > 0; i -= 2) {
			let j = codeBlocks[i - 1][0];
			if (!starters.includes(j)) {
				codeBlocks.splice(i - 1, 2);
			}
		}

		// 生成代码
		var codeSection = [];
		total = codeBlocks.length;
		for (let i = 0; i < total; i += 2) {
			codeSection.push([codeBlocks[i][0], codeBlocks[i + 1][0]]);
		}
		codeSection.forEach(block => {
			var lineS = contents[block[0]];
			var part = lineS.match(/(`{3,}|~{3,})[ 　\t]*/)[0];
			var index = lineS.indexOf(part);
			part = lineS.substr(index + part.length, lineS.length);
			part = part.replace(/^[ 　\t]+|[ 　\t]+$/g, '');
			var prefix = '<pre', postfix = '</code></pre>';
			if (part.length === 0) {
				prefix = prefix + ' lang="' + part + '"><code>';
			}
			else prefix = prefix + '><code>';
			part = prefix;
			var ctx = [];
			for (let i = block[0] + 1; i < block[1]; i ++) {
				ctx.push(contents[i]);
			}
			ctx = ctx.join('\n');
			ctx = prefix + ctx + postfix;

			var key = 'codeblock-' + generateRandomKey();
			doc.finals[key] = ctx;
			contents[block[0]] = '%' + key + '%';
			for (let i = block[0] + 1; i <= block[1]; i ++) {
				contents[i] = null;
			}
			for (let i = block[0]; i <= block[1]; i ++) {
				let line = blockMap[i];
				if (!line) continue;
				let j = blocks.indexOf(line);
				if (j >= 0) blocks.splice(j, 1);
				delete blockMap[i];
				line[0] = -1;
			}
		});

		return codeSection.length > 0;
	};
	const parseTable = (blocks, blockMap, contents, doc, caches) => {
		// 筛选出疑似独立代码块
		var tableBlocks = [];
		blocks.forEach(line => {
			if (!line[6]) return;
			tableBlocks.push(line);
		});

		if (tableBlocks.length === 0) return;

		// 筛选可能的表格区，包括在引用或列表内的也不考虑
		var tables = [], index = 0, last = tableBlocks[0][0];
		tables.push([tableBlocks[0]]);
		var total = tableBlocks.length;
		for (let i = 1; i < total; i ++) {
			let l = tableBlocks[i];
			if (l[0] === last + 1) {
				tables[index].push(l);
			} else {
				index ++;
				tables[index] = [l];
			}
			last = l[0];
		}
		tables = tables.filter(list => {
			if (list.length < 2) return false;
			return true;
		});

		// 生成表格
		tables.forEach(table => {
			generateTable(table, blocks, blockMap, contents, doc, caches);
		});

		return true;
	};
	const parseListAndBlockQuote = (blocks, blockMap, contents, doc, caches) => {
		var end = 0, start = contents.length;
		blocks.forEach((line, i) => {
			if (line[3] + line[4] === 0) return;
			var id = line[0];
			if (id < start) start = id;
			if (id > end) end = id;
		});
		if (start > end) return false;

		// 最后一个表格或引用之后的普通行可能会被忽略，这里要补上
		for (let i = end + 1; i < contents.length - 1; i ++) {
			let a = blockMap[i], b = blockMap[i + 1];
			if (!!a && a[1] > 0 && !!b && b[1] > 0) break;
			end = i;
		}
		if (end === contents.length - 2) {
			let i = contents.length - 1;
			let a = blockMap[i];
			if (!a || a[1] === 0) end = i
		}

		// 将内容分配到分离开的区块中
		var blkID = 0, blockList = [[[start, blockMap[start]]]], isQuote = false, inside = true;
		if (blockMap[start][3] > 0) isQuote = true;
		for (let i = start + 1; i <= end; i ++) {
			var info = blockMap[i];

			// 普通内容行，或者代码块、公式块的内行
			// 则如果原本就在引用或列表内，则继续留在里面
			if (!info) {
				if (inside) blockList[blkID].push([i, null]);
				continue;
			}

			// 判断空行的中断规则
			if (info[1]) {
				if (!inside) continue;
				// 需连续两个空行才中断引用
				let jnfo = blockMap[i + 1];
				if (!jnfo || jnfo[1] > 0) {
					inside = false;
					continue;
				}
				blockList[blkID].push([i, info]);
				continue;
			}

			if (info[3] + info[4] === 0) {
				if (inside) blockList[blkID].push([i, info]);
				continue;
			}

			// 如果还在引用或列表内，则继续留在里面
			if (inside) {
				blockList[blkID].push([i, info]);
				continue;
			}

			// 如果已经不在引用或列表中，则开启新列表
			blkID ++;
			blockList[blkID] = [];
			if (blockMap[i][3] > 0) isQuote = true;
			else isQuote = false;
			inside = true;
			blockList[blkID].push([i, info]);
		}

		// 生成引用块或列表
		var changed = false;
		blockList.forEach(qaBlock => {
			qaBlock.forEach(line => {
				var id = line[0];
				if (!line[1]) contents[id] = '    ' + contents[id];
			});

			var type = 0;
			var id = qaBlock[0][0];
			var ctx = contents[id];
			var type = -1;
			if (!!ctx.match(/^[ 　\t>]/)) type = 0; // 引用
			else if (!!ctx.match(/^[\-\+]|[\*~][ 　\t]/)) type = 1; // 无序列表
			else if (!!ctx.match(/^\d+\.[ 　\t]/)) type = 2;
			if (type < 0) return;
			change = true;
			if (type === 0) generateQuotes(qaBlock, blocks, blockMap, contents, doc, caches);
			else if (type === 1) generateList(false, qaBlock, blocks, blockMap, contents, doc, caches);
			else if (type === 2) generateList(true, qaBlock, blocks, blockMap, contents, doc, caches);
		});
		return changed;
	};
	const parseHeadline = (blocks, blockMap, contents, doc, caches) => {
		var headlines = [], headers = [];
		blocks.forEach(line => {
			if (line[2] === 0) return;
			var id = line[0];
			var info = blockMap[id - 1];
			if (!info) {
				let ctx = contents[id - 1];
				if (id === 0 || !!ctx.match(/^%[\w\-]+%$/)) {
					headlines.push([id, contents[id].replace(/^[ 　\t]+|[ 　\t]+$/, '')[0]]);
				}
				else {
					let c = contents[id].substr(0, 1);
					if (c === '=') headers.push([id - 1, 1]);
					else if (c === '-') headers.push([id - 1, 2]);
					else if (c === '~') headers.push([id - 1, 3]);
					else if (c === '+') headers.push([id - 1, 3]);
					else if (c === '_') headers.push([id - 1, 3]);
					else if (c === '*') headers.push([id - 1, 4]);
					else if (c === '#') headers.push([id - 1, 5]);
					else if (c === '.') headers.push([id - 1, 6]);
					contents[id] = null;
				}
			}
			else {
				if (info[1] > 0) headlines.push([id, contents[id].replace(/^[ 　\t]+|[ 　\t]+$/, '')[0]]);
			}
		});
		for (let i = 0; i < contents.length; i ++) {
			let ctx = contents[i];
			if (!ctx) continue;
			let header = ctx.match(/^(#+)[ 　\t]*/);
			if (!!header) {
				let l = header[0], cp = header[1];
				if (l !== ctx) {
					if (ctx.indexOf(l + '[') !== 0) {
						headers.push([i, cp.length]);
						contents[i] = ctx.replace(/^#+[ 　\t]*|[ 　\t]*#+$/g, '');
					}
				}
			}
		}
		if (headlines.length + headers.length === 0) return false;

		headers.sort((la, lb) => la[0] - lb[0]);

		headlines.forEach(item => {
			var [id, type] = item;
			var key = 'headline-' + generateRandomKey();
			var html = '<hr';
			if (type === '=') html = html + ' class="heavy">';
			else if (type === '-') html = html + ' class="light">';
			else if (type === '*') html = html + ' class="star">';
			else if (type === '~') html = html + ' class="wavy">';
			else if (type === '.') html = html + ' class="dotted">';
			else if (type === '_') html = html + ' class="dashed">';
			else if (type === '+') html = html + ' class="strong">';
			else if (type === '#') html = html + ' class="heavystrong">';
			else html = html + '>';
			caches[key] = html;
			contents[id] = "%" + key + "%";
		});
		headers.forEach(item => {
			var [id, level] = item;
			var key = 'header-' + generateRandomKey();
			var tag = 'h' + (level || 1);
			var html = contents[id];
			html = parseLine(html, doc);
			html = html.replace(/^[ 　\t\n]+|[ 　\t\n]+$/, '');
			html = '<' + tag + '>' + html + '</' + tag + '>';
			caches[key] = html;
			contents[id] = "%" + key + "%";
		});

		return true;
	};
	const parseResources = (blocks, blockMap, contents, doc, caches) => {
		var ctxes = [], changed = true;
		while (changed) {
			changed = false;
			contents.forEach(line => {
				if (line.length === 0) return ctxes.push(line);

				// 将地址引用恢复（使用metas和refs）
				line = line.replace(/(\])[ 　\t]*(\[([\w \-\.]+)\])/g, (match, prefix, all, name) => {
					var ref = doc.refs[name], meta;
					if (!ref || (ref.indexOf('://') < 0 && ref.indexOf('@') < 0) || ref.indexOf('\n') >= 0) {
						meta = doc.metas[name.toLowerCase()];
						if (!meta || (meta.indexOf('://') < 0 && meta.indexOf('@') < 0) || meta.indexOf('\n') >= 0) return match;
						ref = meta;
					}
					return prefix + '(' + ref + ')';
				});

				// 将图片等资源移到下一行
				var resources = [], befores = [], inner_changed = true;
				while (inner_changed) {
					inner_changed = false;
					line = line.replace(/[!@#]\[[^\(\)\[\]\{\}]*?(\[.*?\][ 　\t]*\(.*?\))*?[^\(\)\[\]\{\}]*?\](\([^\(\)\[\]\{\}]*?\))/g, (match, useless, link) => {
						inner_changed = true;
						if (!!link.match(/[ 　\t]+"(left|right)"\)$/)) {
							befores.push(match);
						}
						else {
							resources.push(match);
						}
						return '';
					});
				}
				line = line.replace(/^[ 　\t]+|[ 　\t]+$/g, '');
				befores.forEach(line => ctxes.push(line));
				if (line.length > 0) {
					if (resources.length > 0) changed = true;
					ctxes.push(line);
				}
				resources.forEach(line => ctxes.push(line));
			});

			contents.splice(0, contents.length);
			ctxes.forEach(line => contents.push(line));
			ctxes = [];
		}
		return true;
	};
	const parseParagraph = (blocks, blockMap, contents, doc, caches) => {
		// 分离出连续段落、资源、图片墙
		var paragraphs = [], imagewalls = [], resources = [], last = -1;
		contents.forEach((line, id) => {
			if (!line || line.length === 0) {
				last = -1;
				return;
			}
			var head = line.match(/^%([\w\W]+)%(\{[\w \-\.\u0800-\uffff]+\})*$/);
			if (!!head) {
				last = -1;
				return;
			}
			head = line.match(/^[@#]\[[^\(\)\[\]\{\}]*?(\[.*?\][ 　\t]*\(.*?\))*?[^\(\)\[\]\{\}]*?\]\([^\(\)\[\]\{\}]*?\)$/);
			if (!!head) {
				resources.push([id, line]);
				last = -1;
				return;
			}
			head = line.match(/^!\[[^\(\)\[\]\{\}]*?(\[.*?\][ 　\t]*\(.*?\))*?[^\(\)\[\]\{\}]*?\]\([^\(\)\[\]\{\}]*?\)$/);
			var type = !!head ? 1 : 0;
			if (type === last) {
				if (type === 0) {
					paragraphs[paragraphs.length - 1].push([id, line]);
				}
				else if (type === 1) {
					imagewalls[imagewalls.length - 1].push([id, line]);
				}
			}
			else {
				if (type === 0) {
					paragraphs[paragraphs.length] = [[id, line]];
				}
				else if (type === 1) {
					imagewalls[imagewalls.length] = [[id, line]];
				}
				last = type;
			}
		});
		imagewalls = imagewalls.filter(wall => {
			var isWall = wall.length > 1;
			if (wall.length === 1) resources.push(wall[0]);
			return isWall;
		});

		// 对连续段落作处理
		paragraphs.forEach(group => {
			var content = [];
			var first = group[0][0];
			group.forEach(info => {
				var id = info[0];
				var line = info[1];
				if (line.length === 0) return;
				content.push(parseLine(line, doc));
				contents[id] = null;
			});
			content = content.join('<br>');
			contents[first] = content;
		});

		// 照片墙
		imagewalls.forEach(wall => {
			var content = [];
			var first = wall[0][0];
			wall.forEach(info => {
				content.push(parseLine(info[1], doc));
				contents[info[0]] = null;
			});
			content = content.join('');
			content = '<div class="image-wall">' + content + '</div>';
			var key = 'imagewall-' + generateRandomKey();
			caches[key] = content;
			contents[first] = '%' + key + '%';
		});

		// 独立照片资源
		resources.forEach(res => {
			var [id, content] = res;
			content = parseLine(content, doc);
			var key = 'resource-' + generateRandomKey();
			caches[key] = content;
			contents[id] = '%' + key + '%';
		});
	};

	const generateTable = (table, blocks, blockMap, contents, doc, caches) => {
		var hasHead = true;
		var cfgLine = null, cfgID = -1;

		// 分析表格的对齐信息
		table.some((info, index) => {
			var line = contents[info[0]];
			line = line.replace(/^[ 　\t]+|[ 　\t]+$/g, '');
			var ctx = line.match(/[\|:\-]+/);
			if (!ctx) return;
			ctx = ctx[0];
			if (line === ctx) {
				cfgLine = ctx;
				cfgID = info[0];
				if (index === 0) hasHead = false;
				return true;
			}
		});
		if (!cfgLine) {
			hasHead = false;
			cfgLine = [];
		}
		else {
			cfgLine = cfgLine.replace(/^\||\|$/g, '');
			cfgLine = cfgLine.split('|');
			cfgLine = cfgLine.map(cfg => {
				if (!!cfg.match(/^:\-:$/)) return 1;
				if (!!cfg.match(/^:\-$/)) return 0;
				if (!!cfg.match(/^\-:$/)) return 2;
				return 3;
			});
		}

		// 提取表格内容
		var rows = [], cols = 0;
		table.forEach(line => {
			var num = line[0];
			if (num === cfgID) return;
			var row = parseTableRow(contents[num]);
			rows.push(row);
			if (row.length > cols) cols = row.length;
		});
		for (let j = cfgLine.length; j < cols; j ++) cfgLine.push('');
		for (let i = 0; i < rows.length - 1; i ++) {
			let row = rows[i];
			let rlen = !!row ? row.length : cols;
			for (let j = row.length; j < cols; j ++) row.push('');
		}
		var header;
		if (hasHead) {
			header = rows[0];
			rows.shift();
		}

		// 对自动对齐进行判断
		for (let i = 0; i < cols; i ++) {
			if (cfgLine[i] !== 3) continue;
			let isNumber = true;
			rows.some(row => {
				var item = row[i];
				if (!item) return;
				if (item * 1 !== item) {
					isNumber = false;
					return true;
				}
			});
			if (isNumber) cfgLine[i] = 2;
			else cfgLine[i] = 0;
		}

		// 生成表格正文
		var html = '<table>';
		if (hasHead) {
			html += '<thead><tr>';
			header.forEach((col, i) => {
				col = parseLine(col, doc);
				var ui = '<th align="';
				var c = cfgLine[i];
				if (c === 1) ui += 'center';
				else if (c === 2) ui += 'right';
				else ui += 'left';
				ui += '">' + col + '</td>';
				html += ui;
			});
			html += '</tr></thead>';
		}
		html += '<tbody>';
		rows.forEach(row => {
			html += '<tr>';
			row.forEach((col, i) => {
				col = parseLine(col, doc);
				var ui = '<td align="';
				var c = cfgLine[i];
				if (c === 1) ui += 'center';
				else if (c === 2) ui += 'right';
				else ui += 'left';
				ui += '">' + col + '</td>';
				html += ui;
			});
			html += '</tr>';
		});
		html += '</tbody></table>';

		var key = 'table-' + generateRandomKey();
		caches[key] = html;

		header = table[0][0];
		total = table.length;
		for (let i = 0; i < total; i ++) {
			let line = table[i];
			let id = line[0];
			contents[id] = null;
			delete blockMap[id];
			let j = blocks.indexOf(line);
			if (j >= 0) blocks.splice(j, 1);
			line[0] = -1;
		}
		contents[header] = '%' + key + '%';
	};
	const parseTableRow = line => {
		if (line.substr(0, 1) !== '|') line = '|' + line;
		if (line.substr(line.length - 1, 1) !== '|') line = line + '|';
		var total = line.length, level = 0, parts = [], last = 0;
		for (let i = 1; i < total; i ++) {
			let c = line.substr(i, 1);
			if (c === '|' && level === 0) {
				parts.push(line.substr(last + 1, i - last - 1));
				last = i;
				continue;
			}
			if (('([{<').indexOf(c) >= 0) level ++;
			else if (('>}])').indexOf(c) >= 0) level --;
		}
		return parts;
	};
	const generateQuotes = (quotes, blocks, blockMap, contents, doc, caches) => {
		// 获取引用类型
		var type = 'quote';
		var list = contents[quotes[0][0]];
		list = list.match(/^>[ 　\t]*\[([\w\W]+?)\]/);
		if (!!list) {
			let t = list[1];
			t = t.replace(/^[ 　\t]+|[ 　\t]+$/g, '');
			if (t.length > 0) {
				if (!doc.metas[t] && !doc.blocks[t]) {
					type = t;
				}
			}
		}

		// 整理文档
		var isSub = false;
		list = quotes.map(info => {
			var id = info[0];
			var ctx = contents[id];

			// 去除前缀
			var head = ctx.match(/^[ 　\t]+/);
			if (!!head) {
				head = head[0];
				let len = 0;
				let h = head.match(/ /g);
				if (!!h) len += h.length;
				h = head.match(/　/g);
				if (!!h) len += h.length * 2;
				h = head.match(/\t/g);
				if (!!h) len += h.length * 4;
				h = (Math.floor(len / 4) - 1) * 4;
				let spaces = '';
				for (let i = 0; i < h - 4; i ++) spaces += ' ';
				ctx = ctx.replace(head, spaces);
				isSub = h > 0;
			}
			else {
				head = ctx.match(/^>[ 　\t]*/);
				if (!!head) {
					head = head[0];
					ctx = ctx.replace(head, '');
					isSub = !!ctx.match(/^>[ 　\t]*/);
				}
			}
			return ctx;
		});
		list[0] = list[0].replace(new RegExp('^[ 　\\t]*\\[' + type.replace(/\\/g, '\\\\') + '\\][ 　\\t]*'), '');
		list = list.join('\n');
		list = list.replace(/^\n+|\n+$/g, '');

		var html = '<blockquote class="' + type + '">';
		list = parseSection(list, doc, 2, caches);
		html += list;
		html += '</blockquote>';
		var key = 'blockquote-' + generateRandomKey();
		caches[key] = html;
		quotes.forEach(info => {
			var id = info[0];
			contents[id] = null;
			delete blockMap[id];
			var j = blocks.indexOf(info[1]);
			if (j >= 0) blocks.splice(j, 1);
		});
		contents[quotes[0][0]] = '%' + key + '%';
	};
	const generateList = (ordered, quotes, blocks, blockMap, contents, doc, caches) => {
		// 整理层级结构
		var list = [], lid = -1;
		quotes.forEach(info => {
			var id = info[0];
			var ctx = contents[id];

			// 如果是列表项
			head = ctx.match(/^([\-\+\*>~]|\d+\.)[ 　\t]+/);
			if (!!head) {
				ctx = ctx.replace(head[0], '');
				lid ++;
				list[lid] = [ctx];
				return;
			}

			// 缩进项
			head = ctx.match(/^[ 　\t]+/);
			if (!!head) {
				head = head[0];
				let len = 0;
				let h = head.match(/ /g);
				if (!!h) len += h.length;
				h = head.match(/　/g);
				if (!!h) len += h.length * 2;
				h = head.match(/\t/g);
				if (!!h) len += h.length * 4;
				h = (Math.floor(len / 4) - 1) * 4;
				let spaces = '';
				for (let i = 0; i < h - 4; i ++) spaces += ' ';
				ctx = ctx.replace(head, spaces);
			}
			list[lid].push(ctx);
		});
		list = list.map(item => {
			item = item.join('\n');
			item = item.replace(/^\n+|\n+$/g, '');
			return item;
		});

		var html = '';
		if (ordered) html = '<ol>';
		else html = '<ul>';
		list.forEach(item => {
			html += '<li>';
			html += parseSection(item, doc, 2, caches);
			html += '</li>';
		});
		if (ordered) html += '</ol>';
		else html += '</ul>';

		var key = 'list-' + generateRandomKey();
		caches[key] = html;
		quotes.forEach(info => {
			var id = info[0];
			contents[id] = null;
			delete blockMap[id];
			var j = blocks.indexOf(info[1]);
			if (j >= 0) blocks.splice(j, 1);
		});
		contents[quotes[0][0]] = '%' + key + '%';
	};

	const analyzeSections = (contents, doc) => {
		var sections = [[]], pid = 0, chaps = [0];
		var chapList = [];
		contents.forEach(line => {
			var changed = false;
			line = line.replace(/^<h(\d+)>/i, (match, level) => {
				changed = true;
				level = level * 1;
				if (level === 1) {
					pid ++;
					sections[pid] = [];
				}
				chaps[level - 1] = (chaps[level - 1] || 0) + 1;
				for (let i = level; i < chaps.length; i ++) chaps[i] = 0;
				var chapName = 'chap';
				for (let i = 0; i < level; i ++) chapName += '-' + (chaps[i] || 1);
				match = match + '<a name="' + chapName + '">';
				chapList.push([level, chapName, line.replace(/<[\w\W]+?>/gi, '')]);
				return match;
			})
			.replace(/<\/h(\d+)>$/i, match => '</a>' + match)
			.replace(/\{([\w \-\.]+)\}/g, (match, name) => {
				var title = doc.termList[name];
				if (!title) return match;
				if (Array.isArray(title)) title = title[0];
				return '<a class="terminology" name="' + name + '" href="#ref-' + name + '"><strong>' + title + '</strong></a>';
			});
			sections[pid].push(line);
		});
		sections = sections.filter(group => group.length > 0);
		doc.chapList = chapList;

		// 处理脚注
		sections = sections.map(para => {
			var footnotes = [];
			var prefix = '<section>', postfix = '</section>';
			para.forEach((line, lid) => {
				var changed = false;
				line = line.replace(/<a class="notemark" type="footnote" name="([\w \-\.]+?)">/g, (match, fn) => {
					changed = true;
					footnotes.push(fn);
					var content = match.substr(0, match.length - 1) + ' href="#footnote-' + fn + '">';
					return content;
				});
				if (changed) para[lid] = line;
			});
			para = para.join('');
			if (footnotes.length === 0) return prefix + para + postfix;
			footnotes = footnotes.map((name, i) => {
				var content = doc.refs[name];
				var id = doc.footnotes.indexOf(name);
				i ++;
				para = para.replace(new RegExp('%%FN-' + id + '%%', 'g'), i);
				return '<p class="footnote-content"><a class="index" name="footnote-' + name + '">' + i + '：</a>' + content + '</p>';
			});
			para += '<hr class="footnote-line"><footer><p class="footnote-title">脚注：</p>';
			para += footnotes.join('');
			para += '</footer><hr class="footnote-line end">';
			return prefix + para + postfix;
		});

		// 处理尾注
		if (!!doc.endnotes && doc.endnotes.length > 0) {
			let html = '<hr class="endnote-line">';
			html += '<section class="endnote-chapter"><h1 class="endnote-title"><a name="EndNote">尾注</a></h1>';
			doc.endnotes.forEach((en, i) => {
				html += '<p class="endnote-content"><a class="index" name="endnote-' + en + '">' + (i + 1) + '：</a>' + doc.refs[en] + '</p>';
			});
			html += '</section>';
			sections.push(html);
		}

		// 处理术语表
		if (doc.metas.glossary && !!doc.termList && doc.termList.length > 0) {
			let html = '<hr class="endnote-line">';
			html += '<section class="endnote-chapter"><h1 class="endnote-title"><a name="Glossary">术语表</a></h1>';
			html += generateGlossary(doc);
			html += '</section>';
			sections.push(html);
		}

		// 处理资源表
		doc.image = doc.image || [];
		doc.video = doc.video || [];
		doc.audio = doc.audio || [];
		if (doc.metas.resources && doc.image.length + doc.video.length + doc.audio.length > 0) {
			let html = '<hr class="endnote-line">';
			html += '<section class="endnote-chapter"><h1 class="endnote-title"><a name="ResourceList">资源表</a></h1>';
			if (doc.image.length > 0) {
				html += '<h2><a name="ImageResourceList">图片</a></h2>';
				html += generateResourceList(doc, 'image');
			}
			if (doc.video.length > 0) {
				html += '<h2><a name="VideoResourceList">视频</a></h2>';
				html += generateResourceList(doc, 'video');
			}
			if (doc.audio.length > 0) {
				html += '<h2><a name="AudioResourceList">音频</a></h2>';
				html += generateResourceList(doc, 'audio');
			}
			html += '</section>';
			sections.push(html);
		}

		// 处理标题
		if (doc.metas.showtitle) {
			let ui = '<header class="article-title">';
			ui += '<p>' + doc.metas.title + '</p>';
			if (doc.metas.showauthor && !!doc.metas.author) {
				ui += '<p class="author">';
				if (!!doc.metas.email) ui += '<a href="mailto:' + doc.metas.email + '">';
				ui += doc.metas.author
				if (!!doc.metas.email) ui += '</a>';
				ui += '</p>';
			}
			ui += '</header>';
			sections.unshift(ui);
		}

		return sections;
	};
	const applyBlockReference = (text, doc) => {
		var changed = true, loop = 0;
		while (changed) {
			changed = false;
			text = text.map(line => {
				line = line.replace(/\[([\w \-\.]+?)\]/g, (match, name, pos) => {
					var supStart = line.lastIndexOf('<sup>', pos), supEnd = line.lastIndexOf('</sup>', pos);
					if (supStart > supEnd) return match;
					var content = doc.blocks[name];
					if (!content) return match;
					changed = true;
					return content;
				});
				return line;
			});
			loop ++;
			if (loop === 10) break;
		}
		return text;
	};
	const applyMarkUpReference = (sections, doc) => {
		var lang = (doc.metas.LANG || 'zh').toLowerCase();
		sections = sections.map(section => {
			// 生成术语表
			section = section.replace(/%glossary%/gi, (match) => {
				return generateGlossary(doc);
			});
			// 生成资源表
			section = section.replace(/%resources%/gi, (match) => {
				return generateResourceList(doc, 'image')
					+ generateResourceList(doc, 'video')
					+ generateResourceList(doc, 'audio');
			});
			section = section.replace(/%images%/gi, (match) => {
				return generateResourceList(doc, 'image');
			});
			section = section.replace(/%videos%/gi, (match) => {
				return generateResourceList(doc, 'video');
			});
			section = section.replace(/%audios%/gi, (match) => {
				return generateResourceList(doc, 'audio');
			});
			// 生成目录
			section = section.replace(/%toc%(\{[\w\W]+?\})*/gi, (match) => {
				var cfg = match.match(/\{[\w\W]+?\}/g);
				var title = '目录', level = 3;
				if (!!cfg) {
					cfg.forEach(c => {
						c = c.substr(1, c.length - 2);
						var n = c * 1;
						if (isNaN(n)) title = c;
						else level = n;
					});
				}
				doc.toced = true;
				return generateTableOfContent(doc, title, level);
			});

			// 替换文档元数据
			Object.keys(doc.metas).forEach(key => {
				var content = key.toLowerCase();
				if (PreservedKeywords.includes(key)) return;
				content = doc.metas[key];
				if (content === true || content === false) {
					if (lang === 'zh') content = content ? '是' : '否';
					else content = content ? 'On' : 'Off';
				}
				else if (Array.isArray(content)) {
					if (lang === 'zh') content = content.join('、');
					else content = content.join(', ');
				}
				section = section.replace(new RegExp('%' + key + '%', 'gi'), match => {
					return content;
				});
			});

			// 处理最终不用处理的块
			section = section.replace(/%([\w \-\.]+)%/g, (match, key) => {
				var content = doc.finals[key];
				if (!content) return match;
				return content;
			});

			return section;
		});
		// 如果没生成过目录，且生成目录开关已打开，则在文档头补熵目录
		if (doc.metas.toc && !doc.toced) {
			let toc = generateTableOfContent(doc, '目录', 3);
			if (toc.indexOf('<p class="content-') >= 0) {
				toc = '<section>' + toc + '</section>';
				if (doc.metas.showtitle) {
					sections.splice(1, 0, toc);
				}
				else {
					sections.unshift(toc);
				}
			}
		}
		return sections;
	};
	const generateTableOfContent = (doc, title, level) => {
		var html = '<h1 name="ContentTable">' + title + '</h1><aside class="content-table">';
		doc.chapList.forEach(info => {
			if (info[0] > level) return;
			var ui = '<p class="content-item level-' + info[0] + '">';
			for (let i = 0; i < info[0]; i ++) {
				ui += '<span class="content-indent"></span>';
			}
			ui += '<a class="content-link" href="#' + info[1] + '">' + info[2] + '</a>';
			ui += '</p>';
			html += ui;
		});
		if (!!doc.endnotes && doc.endnotes.length > 0) {
			html += '<p class="content-item level-1"><span class="content-indent"></span><a class="content-link" href="#EndNote">尾注</a></p>';
		}
		if (doc.metas.glossary && !!doc.termList && doc.termList.length > 0) {
			html += '<p class="content-item level-1"><span class="content-indent"></span><a class="content-link" href="#Glossary">术语表</a></p>';
		}
		if (doc.metas.resources && doc.image.length + doc.video.length + doc.audio.length > 0) {
			html += '<p class="content-item level-1"><span class="content-indent"></span><a class="content-link" href="#ResourceList">资源表</a></p>';
			if (doc.image.length > 0) {
				html += '<p class="content-item level-2"><span class="content-indent"></span><span class="content-indent"></span><a class="content-link" href="#ImageResourceList">图片</a></p>';
			}
			if (doc.video.length > 0) {
				html += '<p class="content-item level-2"><span class="content-indent"></span><span class="content-indent"></span><a class="content-link" href="#VideoResourceList">视频</a></p>';
			}
			if (doc.audio.length > 0) {
				html += '<p class="content-item level-2"><span class="content-indent"></span><span class="content-indent"></span><a class="content-link" href="#AudioResourceList">音频</a></p>';
			}
		}
		html += '</aside>';
		return html;
	};
	const generateGlossary = (doc) => {
		var html = '';
		if (doc.termList === 0) return '';
		doc.termList.forEach(item => {
			var [key, title] = item;
			var content = doc.terms[key];
			var ui = '<p class="glossary-item">'
			ui += '<a class="glossary-indent" name="ref-' + key + '">' + title + '</a>';
			ui += content;
			ui += '</p>';
			html += ui;
		});
		return html;
	};
	const generateResourceList = (doc, type) => {
		var resources = doc[type];
		if (!resources || !Array.isArray(resources) || resources.length === 0) return '';
		var list = [];
		var ui = '<ul>';
		resources.forEach(item => {
			var res = item[1];
			if (list.includes(res)) return;
			list.push(res);
			ui += '<li><a href="' + res + '" target="_blank">' + res + '</a></li>';
		});
		ui += '</ul>';
		return ui;
	};

	// 保留字符处理
	const convertPreserves = content => {
		content = content.replace(/(\\+)(.)/g, (match, slash, mark) => {
			var count = Math.floor(slash.length / 2);
			var needConvert = (count * 2 !== slash.length);
			var result = '';
			var meta = '%' + PreserveWords['\\'] + '%';
			for (let i = 0; i < count; i ++) result += meta
			if (needConvert) {
				let word = PreserveWords[mark];
				if (!word) result = result + mark;
				else result = result + '%' + word + '%';
			}
			else {
				result = result + mark;
			}
			return result;
		});
		return content;
	};
	const restorePreserves = (content, caches, inline=true) => {
		var changed = true;
		while (changed) {
			changed = false;
			content = content.replace(/\%([\w \-]+?)\%/g, (match, mark) => {
				var word = caches[mark]
				if (!!word) {
					changed = true;
					return word;
				}
				return match;
			});
		}

		if (!inline) return content;

		changed = true;
		while (changed) {
			changed = false;
			content = content.replace(/\%([\w \-]+?)\%/g, (match, mark) => {
				var word = caches[SymHidden][mark.toLowerCase()];
				if (!!word) {
					changed = true;
					return word;
				}
				return match;
			});
		}

		// 处理软换行
		content = content.replace(/\n+/g, '<br>');
		content = content.replace(/\/{2}/g, (match, pos) => {
			if (pos === 0) return '<br>';
			var prev = content.substr(pos - 1, 1);
			if (prev === ':') return match;
			return '<br>';
		});
		content = content.replace(/^(<\/?br>)+|(<\/?br>)+$/gi, '<br>');
		return content;
	};
	const getKeywords = words => {
		if (!words) return [];
		words = words.split(/[ ,，；;、　]+/).filter(w => w.length > 0);
		var list = [];
		words.forEach(w => {
			if (list.includes(w)) return;
			list.push(w);
		});
		return list;
	};

	// 解析元数据
	const getMetas = (doc, text) => {
		var metas = {};
		var nonStop = true;

		// 解析文档元数据
		while (nonStop) {
			nonStop = false;
			text = text.replace(/\n([A-Z\u0800-\uffff]+?) *[:：] *([\w\W]*?)\n/, (match, key, value) => {
				if (value.length === 0) return match;
				if (key === '标题') key = 'title';
				else if (key === '作者') key = 'author';
				else if (key === '简介') key = 'description';
				else if (key === '关键词') key = 'keyword';
				else if (key === '更新') key = 'date';
				else key = key.toLowerCase();
				if (!MetaWords.includes(key)) return match;
				nonStop = true;
				metas[key] = value;
				return '\n';
			});
		}
		if (!!metas.showtitle && ['on', 'yes', 'true'].includes(metas.showtitle.toLowerCase())) metas.showtitle = true;
		else metas.showtitle = false;
		if (!!metas.glossary && ['on', 'yes', 'true'].includes(metas.glossary.toLowerCase())) metas.glossary = true;
		else metas.glossary = false;
		if (!!metas.links && ['on', 'yes', 'true'].includes(metas.links.toLowerCase())) metas.links = true;
		else metas.links = false;
		if (!!metas.refs && ['on', 'yes', 'true'].includes(metas.refs.toLowerCase())) metas.refs = true;
		else metas.refs = false;
		if (!!metas.terms && ['on', 'yes', 'true'].includes(metas.terms.toLowerCase())) metas.terms = true;
		else metas.terms = false;
		if (!!metas.resources && ['on', 'yes', 'true'].includes(metas.resources.toLowerCase())) metas.resources = true;
		else metas.resources = false;
		if (!!metas.toc && ['on', 'yes', 'true'].includes(metas.toc.toLowerCase())) metas.toc = true;
		else metas.toc = false;
		doc.metas = metas;
		doc.metas.keyword = getKeywords(doc.metas.keyword)
		if (!!doc.metas.date) {
			try {
				doc.metas.date = (new Date(doc.metas.date)).getTime();
			} catch {
				delete doc.metas.date;
			}
		}
		doc.metas.god = doc.metas.theone = '<a href="mailto:lostabaddon@gmail.com">LostAbaddon</a>';
		if (doc.metas.script) {
			doc.metas.script = doc.metas.script.split(/[,; 　\t]+/);
		}
		else doc.metas.script = [];
		if (doc.metas.style) {
			doc.metas.style = doc.metas.style.split(/[,; 　\t]+/).map(style => {
				return style.replace(/\{[\w\W]*\}/, '');
			});
		}
		else doc.metas.style = [];
		doc.termList = doc.termList || [];
		doc.mainParser = false;

		// 解析引用文本
		doc.refs = {};
		nonStop = true;
		while (nonStop) {
			nonStop = false;
			text = text.replace(/\n\[([\w \-\.\+\=\\\/]+?)\] *[:：] *([\w\W]+?)\n([\n\[])/, (match, key, value, left, pos) => {
				key = key.trim();
				value = value.trim();
				if (key.length === 0 || value.length === 0) return match;
				doc.refs[key] = value;
				nonStop = true;
				return '\n' + left;
			});
		}

		// 解析引用块
		doc.blocks = {};
		nonStop = true;
		while (nonStop) {
			nonStop = false;
			text = text.replace(/\[:([\w \-\.\+\=\\\/]+?):\]([\w\W]*?)\n*\[:\1:\]/g, (match, name, content) => {
				name = name.trim();
				if (name.length === 0 || content.length === 0) return;
				doc.blocks[name] = content;
				nonStop = true;
				return '';
			});
		}

		Object.keys(doc.refs).forEach(key => {
			var line = doc.refs[key];
			line = parseLine(line, doc);
			// 恢复保留字
			line = line.replace(/\%([\w \-]+?)\%/g, (match, mark) => {
				var word = ReversePreserveWords[mark.toLowerCase()];
				if (!!word) return word;
				return match;
			});
			var content = parseLine(line, doc);
			doc.refs[key] = line;
		});
		Object.keys(doc.blocks).forEach(key => {
			var line = doc.blocks[key];
			var header = line.match(/^\n+/);
			line = line.trim();
			var content;
			doc.parseLevel = 0;
			if (!header) content = [parseLine(line, doc)];
			else content = parseSection(line, doc, 1);
			doc.blocks[key] = content.join('');
		});

		doc.anchors = [];
		doc.terms = {};
		doc.notes = {};
		text.replace(/\] *(\[[\^:]([\w ]+?)\]|\{([\w ]+?)\})/g, (match, usage, key1, key2) => {
			var key = key1 || key2;
			if (!doc.refs[key]) {
				if (usage.substr(0, 1) === '{' && !doc.anchors.includes(key)) doc.anchors.push(key);
			}
			else if (usage.substr(0, 1) === '{') {
				doc.terms[key] = doc.refs[key];
			}
			else {
				doc.notes[key] = doc.refs[key];
			}
		});

		// 合并回文档
		text = regularize(text);

		return text;
	};

	MarkUp.fullParse = (text, config) => {
		var docTree = {
			finals: {},
			toced: false,
		};

		text = prepare(text);
		text = getMetas(docTree, text);
		if (!!config) Object.keys(config).forEach(key => {
			key = key.toLowerCase();
			let value = config[key];
			if (value !== undefined && value !== null) docTree.metas[key] = value;
		});
		docTree.parseLevel = 0;
		docTree.mainParser = true;
		docTree.metas.title = docTree.metas.title || '无名文';

		// 主体解析
		text = parseSection(text, docTree);

		// 恢复保留字
		text = text.map(content => {
			return content.replace(/\%([\w \-]+?)\%/g, (match, mark) => {
				var word = ReversePreserveWords[mark.toLowerCase()];
				if (!!word) return word;
				return match;
			});
		});

		// 实现引用块
		text = applyBlockReference(text, docTree);

		// 开始划分章节
		text = analyzeSections(text, docTree);

		// 处理系统级引用
		text = applyMarkUpReference(text, docTree);

		if (docTree.metas.classname) text = '<article class="' + docTree.metas.classname + '">' + text.join('') + '</article>';
		else text = '<article>' + text.join('') + '</article>';

		if (docTree.metas.fullexport) {
			docTree.metas.style.forEach(line => {
				text += '<link type="text/css" rel="stylesheet" href="' + line + '">';
			});
			docTree.metas.script.forEach(line => {
				text += '<script type="text/javascript" src="' + line + '"></script>';
			});
		}

		var indexes = FinalRender['_indexes_'] || [];
		indexes.forEach(index => {
			var renderList = FinalRender[index];
			if (!renderList) return;
			renderList.forEach(render => {
				text = render.parse(text);
			});
		});

		var result = {};
		result.content = text;
		result.title = docTree.metas.title;
		result.lineCount = docTree.metas.totalLineCount;

		result.meta = {};
		result.meta.author = docTree.metas.author;
		result.meta.email = docTree.metas.email;
		result.meta.description = docTree.metas.description;
		result.meta.update = docTree.metas.date;
		result.meta.keywords = docTree.metas.keyword.map(kw => kw);

		result.terminology = {};
		docTree.termList.forEach(item => {
			result.terminology[item[0]] = item[1];
		});

		result.notes = {};
		Object.keys(docTree.refs).forEach(name => {
			result.notes[name] = docTree.refs[name];
		});

		result.blocks = {};
		Object.keys(docTree.refs).forEach(name => {
			result.blocks[name] = docTree.blocks[name];
		});

		return result;
	};
	MarkUp.parse = (text, config) => {
		var result;
		result = MarkUp.fullParse(text, config);
		if (!result) return '';
		return result.content;
	};

	const reverseSection = (section, config) => {
		config.__level ++;
		var contents = [], line = '', singleLine = true;
		section.childNodes.forEach(n => {
			var tag = n.tagName;
			if (!tag) {
				if (n.nodeName === '#comment') return;
				let inner = n.textContent || '';
				inner = inner.trim();
				if (inner.length > 0) line += inner;
				return;
			}

			tag = tag.trim().toLowerCase();
			var inner;
			if (ParagraphTags.includes(tag)) {
				singleLine = false;
				if (line.length > 0) {
					contents.push(config.__prefix + line);
					line = '';
				}

				if (tag === 'blockquote') {
					let lastPrefix = config.__prefix;
					config.__prefix = config.__prefix + '>\t';
					inner = reverseSection(n, config);
					inner = inner.flat(Infinity);
					inner.push('\n');
					config.__prefix = lastPrefix;
				}
				else if (tag === 'ol') {
					let lastPrefix = config.__prefix;
					if (config.__prefix.indexOf('-\t') >= 0 || config.__prefix.indexOf('1.\t') >= 0) config.__prefix = '\t' + config.__prefix;
					else config.__prefix = config.__prefix + '1.\t';
					inner = reverseSection(n, config);
					inner = inner.flat(Infinity);
					inner.push('');
					config.__prefix = lastPrefix;
				}
				else if (tag === 'ul') {
					let lastPrefix = config.__prefix;
					if (config.__prefix.indexOf('-\t') >= 0 || config.__prefix.indexOf('1.\t') >= 0) config.__prefix = '\t' + config.__prefix;
					else config.__prefix = config.__prefix + '-\t';
					inner = reverseSection(n, config);
					inner = inner.flat(Infinity);
					inner.push('');
					config.__prefix = lastPrefix;
				}
				else {
					inner = reverseSection(n, config);
					inner = inner.flat(Infinity);
					inner.push('');
				}
				if (!!inner && inner.length > 0) contents.push(...inner);
			}
			else {
				let [inner, isInline] = reverseMix(n, tag, config);
				if (isInline) {
					if (inner.length > 0) {
						line += inner.join('');
					}
				}
				else {
					if (line.length > 0) {
						contents.push(config.__prefix + line);
						line = '';
					}
					inner.forEach(l => {
						contents.push(config.__prefix + l);
					});
				}
			}
		});
		if (line.length > 0) contents.push(config.__prefix + line);
		config.__level --;
		return contents;
	};
	const reverseLine = (node, config) => {
		var line = '';
		node.childNodes.forEach(n => {
			var tag = n.tagName;
			if (!tag) {
				if (n.nodeName === '#comment') return;
				let inner = n.textContent || '';
				inner = inner.trim();
				if (inner.length > 0) line += inner;
				return;
			}

			tag = tag.trim().toLowerCase();
			if (tag === 'a') {
				let url = n.href;
				if (url.indexOf('javascript:') === 0) url = '';
				let inner = reverseLine(n, config);
				if (!url || url.substr(0, 1) === '#') {
					line += inner;
				}
				else {
					if (!url.match(/^(ftp|https?):\/\//i)) url = config.host + url;
					inner = '[' + inner + '](' + url + ')';
					line += inner;
				}
				return;
			}
			if (tag === 'span' || tag === 'font') {
				let inner = reverseLine(n, config);
				line += inner;
				return;
			}
			if (tag === 'strong' || tag === 'b') {
				let inner = reverseLine(n, config);
				line += inner;
				return;
			}
			if (tag === 'em' || tag === 'i') {
				let inner = reverseLine(n, config);
				line += inner;
				return;
			}
			if (tag === 'sup') {
				let inner = reverseLine(n, config);
				line += inner;
				return;
			}
			if (tag === 'sub') {
				let inner = reverseLine(n, config);
				line += inner;
				return;
			}
			if (tag === 'del') {
				let inner = reverseLine(n, config);
				line += inner;
				return;
			}
			line += n.innerText;
		});
		return line;
	};
	const reverseMix = (node, tag, config) => {
		if (tag === 'script') return [[''], true];
		if (tag === 'style') return [[''], true];
		if (tag === 'link') return [[''], true];
		if (tag === 'hr') return [['\n---\n'], false];
		if (tag === 'br') return [['\n'], true];
		if (tag.match(/^h\d+$/)) {
			let lev = tag.substring(1, tag.length);
			lev *= 1;
			let prefix = '\n';
			for (let i = 0; i < lev; i ++) prefix += '#';
			let line = reverseLine(node, config);
			line = prefix + line + '\n';
			return [[line], false];
		}
		if (tag === 'a') {
			let url = node.href;
			if (url.indexOf('javascript:') === 0) url = '';
			let inner = reverseLine(node, config);
			if (!url || url.substr(0, 1) === '#') return [[inner], true];
			if (!url.match(/^(ftp|https?):\/\//i)) url = config.host + url;
			inner = '[' + inner + '](' + url + ')';
			return [[inner], true];
		}
		if (tag === 'img') {
			if (node.src.length === 0) return [[''], true];
			let inner = '\n![](' + node.src + ')\n';
			return [[inner], false];
		}
		if (tag === 'video') {
			if (node.src.length === 0) return [[''], true];
			let inner = '\n@[](' + node.src + ')\n';
			return [[inner], true];
		}
		if (tag === 'audio') {
			if (node.src.length === 0) return [[''], true];
			let inner = '\n#[](' + node.src + ')\n';
			return [[inner], true];
		}
		if (tag === 'span' || tag === 'font') {
			let inner = reverseLine(node, config);
			return [[inner], true];
		}
		if (tag === 'strong' || tag === 'b') {
			let inner = reverseLine(node, config);
			return [['**' + inner + '**'], true];
		}
		if (tag === 'em' || tag === 'i') {
			let inner = reverseLine(node, config);
			return [['*' + inner + '*'], true];
		}
		if (tag === 'u') {
			let inner = reverseLine(node, config);
			return [['__' + inner + '__'], true];
		}
		if (tag === 'sup') {
			let inner = reverseLine(node, config);
			return [['^' + inner + '^'], true];
		}
		if (tag === 'sub') {
			let inner = reverseLine(node, config);
			return [['_' + inner + '_'], true];
		}
		if (tag === 'del') {
			let inner = reverseLine(node, config);
			return [['~~' + inner + '~~'], true];
		}
		var content = reverseLine(node, config);
		return [[content], false];
	};

	MarkUp.reverse = (ele, config, outmost=true) => {
		if (!ele) return '';
		config = config || {};
		config.__level = 0;
		config.__prefix = '';
		config.host = config.host || '';
		var content = reverseSection(ele, config);
		content = content.flat(Infinity);
		content = content.join('\n');
		content = content.replace(/\n{2,}/g, '\n\n');
		return content;
	};

	MarkUp.parseLine = parseLine;
	MarkUp.parseSection = parseSection;

	MarkUp.generateRandomKey = generateRandomKey;

	MarkUp.SymHidden = SymHidden;
	MarkUp.PreserveWords = PreserveWords;

	window.MarkUp = MarkUp;
}) ();