# ArticleUtils

内容相关工具集（自带 MarkUp 解释器与编辑器哦~），很实用的瑞士军刀~

- **版本**： 2.0.1
- **作者**： [LostAbaddon](mailto:lostabaddon@gmail.com)
- **网址**： [GitHub](https://github.com/LostAbaddon/ArticleUtils)

- **Chrome Web Store发行版本**：暂未发布
- **Chrome Web Store发行地址**：暂未发布

## 主要功能：

1.	LaTeX 公式转换
2.	资源自动搜索
3.	划词翻译
4.	文章存档
5.	MarkUp 解释器与编辑器
6.	本地文库（开发中）

详细介绍见后文。

## 使用方法

### 1，通过 Chrome Web Store 安装到浏览器并使用（暂未发布）

### 2，通过源码载入浏览器并使用：

-	下载源码
-	启用浏览器开发者模式
-	载入源码所在目录
-	正常使用

## 关于键列

键列和快捷键不同，它是输入的按键序列。比如 `ctrl+ctrl+s` 指的就是连续按下两次 `ctrl` 再按下一次 `s`，而不是同时按下两个 `ctrl` 与一个 `s`。

键列的两次按键之间的时间间隔不能超过 300ms。

比如，你可以在任意页面上试着按下《魂斗罗》最经典的密码试试~~

## 功能一：LaTeX 公式转换

使用公开的 [MathJax 库](https://www.mathjax.org/mathjax-v2-5-now-available/)将页面中的 LaTeX 公式转换为显示友好的 HTML 标签，便于浏览。

### 功能

-	使用 MathJax 2.5，支持 AMSmath 与 AMSsymbols 包
-	对 MathJax 进行裁剪，不支持增加新包，只能输出为 HTML，不支持 MathML
-	能自动识别页面中是否有 LaTeX 语句，没有的话不启用转换插件

### 使用方法

-	选项页开关
-	键列开关（ctrl+ctrl+m）

## 功能二：资源自动搜索

能将页面上的书籍、影视等资源，并使用自定义的搜索引擎进行自动搜索。搜索引擎可自定义，通过页面内容提取将搜索结果汇整到当前页面的搜索抽屉中。

支持的资源类型：

-	书籍
-	影视
-	文章
-	百科
-	新闻
-	网络其它资源

### 功能

-	自动识别当前页中所有资源
	+	可自定义是否自动搜索
	+	可划词搜索资源（无划词时自动识别当前页资源）
	+	支持中英文资源使用不同的搜索引擎
-	使用配置好的搜索引擎寻找书籍、电影以及综合搜索结果
	+	可自定义搜索引擎
-	在一段时间内使用缓冲而不重复搜索资源
	+	可自定义缓存时长与强制回收的使用量占比
-	可在选项中设置不自动搜索资源的规则（但仍可使用键列启动资源搜索）
-	每个域名下的一级目录可设置自己的搜索规则，选择哪些类型的资源不搜索（手动触发的搜索不受此限制）

### 使用方法

-	选项页开关
-	键列开关（ctrl+ctrl+s），支持划词
-	右键菜单，支持划词、选择分类、选择引擎

## 功能三：划词翻译

使用[金山词霸](http://www.iciba.com/)、[彩云小译](https://fanyi.caiyunapp.com/)、[Bing 翻译](https://www.bing.com/translator)这些在线平台进行翻译，并将翻译结果汇整到当前页面。

未来会考虑接入[谷歌翻译](https://translate.google.com/)等更多翻译服务平台。

### 功能

-	划词后提取划中词句进行翻译
-	可使用快捷键 `alt+T` 或键列 `ctrl+ctrl+T` 来触发划词翻译
-	使用 IndexedDB 对翻译内容进行保存并在过期后自动回收空间，以降低网络请求

### 特别说明

**由于没找到金山词霸与 Bing 翻译的公开 WebAPI，所以这里采用的可能是非正常 AJAX 方式来获取翻译结果，若有问题请告知我，我会将此功能删除。**

## 功能四：内容存档并搜索

将当前页内容存档，方便未来阅读。

当前版本只支持对文字进行存档，暂不支持对图片的存档。

且暂时所有文字都保存在 IndexedDB 中，未来开发后端后会考虑保存在云上。

### 功能

-	自动识别正文区并存档
-	也可手动选择要存档内容
	+	划词存档
	+	双击页面选定要存档内容所在容器
-	可通过 Badge、右键菜单、快捷键（`alt+A`）和键列（`ctrl+ctrl+A`）来触发存档
-	可通过 Badge、快捷键（`ctrl+shift+A`）和键列(`ctrl+ctrl+A+A`) 来查看既有存档

## 功能五：MarkUp 编辑器

MarkUp 是在 MarkDown 基础上的增强型语言，支持 MarkDown 的所有语法，但有所增强。

本插件自带本作者自制的最新 MarkUp 语法解释器，并用在存档内容编辑上。

可打开本地 MarkDown / MarkUp 文档进行编辑。

## 其它说明

-	所有配置都可在选项页导出，未来会增加配置导入功能。
-	本插件使用 LRUCache 做内存缓存，IndexedDB 做本地数据储存。
-	本插件可自动识别页面正文区域，并生成内容指纹（相似哈希，故可在一定程度上去除文本内容小变化带来的影响）。

## 功能六：本地文库（开发中）

基于 MarkUp 的本地文库，支持浏览器内的本地文库管理、本地文件管理（读写，未来有后端后支持本地目录管理），支持书目、作品集、专题等多种形式的内容集，支持划词评论（本地文库与存档内容都自持）。

## TODO

-	小工具：
	+	Badge 调色盘
-	搜索相关：
	+	更好地识别页面中的资源
	+	自动完成翻译后中英文搜索新闻
	+	支持搜索本地存档库
	+	搜索结果显示优化：只显示少数几条，多出的延迟显示
-	归档功能：
	+	能保存图片
	+	增加标签功能
	+	标签树
-	内容地图相关：
	+	记录资源搜索的历史记录，建立术语表（主要针对百科类）
	+	根据术语表，在每个页面进行自动划词以便快捷搜索
-	MarkUp 编辑器：
	+	输入 Enter 与 Tab 后的处理需要优化
	+	编辑本地文件
	+	IndexedDB 中的本地文章库
	+	FileSystem 中的图片资源库
	+	支持直接黏贴富文本内容
	+	支持多页编辑
-	本地文库
	+	基于 IndexedDB 与 WebSQL 的本地文库
	+	增加对本地 MarkUp 文件的支持
	+	MarkUp 的跨文件引用
	+	作品集、专题、书目的支持
	+	划词评论的支持（对存档一样支持）
	+	分类网