# ArticleUtils

内容相关工具集，很实用的瑞士军刀~

- **版本**： 0.0.6
- **作者**： [LostAbaddon](mailto:lostabaddon@gmail.com)
- **网址**： [GitHub](https://github.com/LostAbaddon/ArticleUtils)

## 1.0.0（开发中）

-	识别 LaTeX 公式并转换为图片
	+	功能：
		*	使用 MathJax 2.5，支持 AMSmath 与 AMSsymbols 包
		*	对 MathJax 进行裁剪，不支持增加新包，只能输出为 HTML，不支持 MathML
		*	能自动识别页面中是否有 LaTeX 语句，没有的话不启用转换插件
	+	使用：
		*	选项页开关
		*	键列开关（ctrl+ctrl+m）
-	识别文章、书籍、视频，并自动进行资源搜索（开发中：搜索文章、新闻、百科）
	+	自动识别当前页中所有资源
		*	可自定义是否自动搜索
		*	可通过键列激活搜索（ctrl+ctrl+s）
	+	使用配置好的搜索引擎寻找书籍、电影以及综合搜索结果
		*	可自定义搜索引擎（开发中）
	+	在一段时间内实用缓冲而不重复搜索资源
		*	可自定义缓存时长（开发中）

## 2.0.0（计划中）

-	将当前页面的内容部分保存下来以便日后查阅