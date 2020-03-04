# ArticleUtils

内容相关工具集，很实用的瑞士军刀~

- **版本**： 0.9.1
- **作者**： [LostAbaddon](mailto:lostabaddon@gmail.com)
- **网址**： [GitHub](https://github.com/LostAbaddon/ArticleUtils)

## LaTeX 公式转换

使用公开的 [MathJax 库](https://www.mathjax.org/mathjax-v2-5-now-available/)将页面中的 LaTeX 公式转换为显示友好的 HTML 标签，便于浏览。

### 功能

-	使用 MathJax 2.5，支持 AMSmath 与 AMSsymbols 包
-	对 MathJax 进行裁剪，不支持增加新包，只能输出为 HTML，不支持 MathML
-	能自动识别页面中是否有 LaTeX 语句，没有的话不启用转换插件

### 使用方法

-	选项页开关
-	键列开关（ctrl+ctrl+m）

## 资源自动搜索

能将页面上的书籍、影视等资源，并使用自定义的搜索引擎进行自动搜索。

支持的资源类型：

-	书籍
-	影视
-	文章（开发中）
-	百科（开发中）
-	网络其它资源

### 功能

-	自动识别当前页中所有资源
	+	可自定义是否自动搜索
	+	可划词搜索资源（无划词时自动识别当前页资源）
-	使用配置好的搜索引擎寻找书籍、电影以及综合搜索结果
	+	可自定义搜索引擎
-	在一段时间内使用缓冲而不重复搜索资源
	+	可自定义缓存时长与强制回收的使用量占比

### 使用方法

-	选项页开关
-	键列开关（ctrl+ctrl+s），支持划词
-	右键菜单，支持划词

## 1.0.0 TODO:

-	右键搜索
-	增加不自动搜索网址设置
-	搜索文章、新闻和百科

## 2.0.0（计划中）

-	将当前页面的内容部分保存下来以便日后查阅
-	记录资源搜索的历史记录，建立术语表
-	根据术语表，在每个页面进行自动划词以便快捷搜索
-	Markdown2RichText 搬家工具