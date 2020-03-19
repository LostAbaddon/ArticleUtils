TITLE: MarkUp 语法演示文档
AUTHOR: LostAbaddon
EMAIL: LostAbaddon@gmail.com
DESCRIPTION: MarkUp 语法演示文档，展示了所有可用的 MarkUp 语法
DATE: 2020/03/11 23:34:45

[TOC]{目录}

---

支持语法
===


1，段级语法（二级标题）
---

### 1.1，三级标题

#### 1.1.1，四级标题

##### 1.1.1.1，五级标题

可使用任意多前置“#”来表示任意多级子标题

### 引用

方法一：置顶“>”激活引用块。
方法二：置顶至少四个空格或者一个 tab 激活引用块。

方法一支持引用中嵌套引用，方法二不支持。相邻引用块如果间隔少于三个空行，则自动合并。

示例：

> 方法一



    方法二（空格）



	方法二（tab）



> 方法一

    相邻少于三个空行的另一个引用块



> 方法一
>> 嵌套方法一

引用可以有四种不同的类型，写法为：`> [type] xxxx`，这里 type 为：

-	info（默认）
-	warning
-	success
-	danger

### 代码块

前后三个“`”之间的区域为代码块。首三个“`”之后可跟代码语言名。

示例：

```javascript
fun = () => console.log('success!');
fun();
```

或者用三个 `~` 也可以哦：

~~~java
public void main () {
	printf("Oh Yeah~~");
}
~~~

### LaTeX 公式块

前后两个“$”之间的区域为公式块。

示例：

$$
R_{\mu \nu} - \frac{1}{2} R g_{\mu \nu} + \Lambda g_{\mu \nu} = G T_{\mu \nu}
$$

### 非分段换行

两行文字之间没有空行，为非分段换行。
比如现在你看到的这个。

### 分段换行

两行文字之间有至少一个空行，为分段换行。

比如现在你看到的这个。

每一段的末尾都可以使用 `{<}` 表示左对齐、`{>}` 表示右对齐、`{|}` 表示居中。非分段换行无法独立设置对齐方向。
此外，每一段的开头可使用置顶的 `:` 来缩进，`:` 越多缩进得越多（10px 一级）。

### 图片

图片语法为`![图片标题](图片地址)`，在 MarkUp 文本中，图片单独一行。![](https://upload-images.jianshu.io/upload_images/19321-e5e574ddb183cacf.jpg?imageMogr2/auto-orient/strip|imageView2/2/w/640/format/webp)

如果多个图片在一起，可自动生成横向滚动图片墙：

![](https://upload-images.jianshu.io/upload_images/19321-e5e574ddb183cacf.jpg?imageMogr2/auto-orient/strip|imageView2/2/w/640/format/webp)
![](https://upload-images.jianshu.io/upload_images/6860761-fd2f51090a890873.jpg?imageMogr2/auto-orient/strip|imageView2/2/w/550/format/webp)
![](https://upload-images.jianshu.io/upload_images/19321-e5e574ddb183cacf.jpg?imageMogr2/auto-orient/strip|imageView2/2/w/640/format/webp)
![](https://upload-images.jianshu.io/upload_images/6860761-fd2f51090a890873.jpg?imageMogr2/auto-orient/strip|imageView2/2/w/550/format/webp)

图片和超链接都可以使用资源引用方法：`![图片标题][地址引用]`

### 视频

视频和图片一样，独立一行，但视频没有图片墙功能。
视频的语法为：`@[视频标题](视频地址)`或`@[视频标题][地址引用]`

### 音频

音频也和图片一样，独立一行，也没有图片墙功能。
音频的语法为：`#[音频标题](音频地址)`或`#[音频标题][地址引用]`

### 列表

`-`、`+`、`*`、`~` 开头为无序列表，`>` 可用于子列表；`num.` 开头为有序列表。列表可嵌套，可实现自动嵌套计数。

### 表格

表格语法为：

```
|col1|col2|col3|
|-|-|-|
|xx|xx|xx|
|xx|xx|xx|
```

效果为：

|col1|col2|col3|
|-|-|-|
|xx|xx|xx|
|xx|xx|xx|

在表格内写所有非段落块级内容，如果有复杂内容，可使用宏标记来引用。

表格代码两头的 `|` 可以省略。

此外还有一种更加省略的写法，没有表格头——用中英文冒号分隔：

```
名称A:	内容A
名称B：	内容B
名称C:	内容C
```

### 分割线

分割线可以是`---`、`***`、`===`、`+++`的任意一种，其中符号数量任意，但不可混用。

### 标记地址

语法为：`[xxx]: xxx`
此内容不会显示，但可在连接、图片、视频、音频等地使用为地址。
也可以用于定义脚注和尾注的内容。

### MarkUp 新增语法：标记块

使用 `[:xxx:]` 放在一个块的前后，则此间生成的块被定义为名称为 `xxx` 的宏。
要使用该宏，则独立一个块，内容为 `[xxx]`。
注意：TOC 的各大小写版本都不能作为宏名。

### 强制段落格式终止

可使用 `//` 来强制终止段落，此后到最近换行之间的内容全部无视，且即便后面没有空行直接跟内容也会被视为分开的两端。

## 2，字级语法

### 常用格式：

`*xxx*` 为斜体，`**xxx**` 为粗体，`***xxx***` 为粗斜体，但与 MarkDown 不同的是，`_xxx_` 在这里表示下标，`__xxx__` 表示下划线。
`~~xxx~~` 表示删除线，`^xxx^` 表示上标，`^^xxx^^` 为大一号字体（可用更多 `^` 来不断增大，但必须前后匹配），`\`xxx\`` 表示代码变量，`$xxx$` 表示公式变量。

`[]()` 为超链接，也可以使用 `[][]`。文章内的锚点可用 `[]{xxx}` 定义，从而可以在超链接中使用锚点实现跳转。超链接如果直接写出，只要前后有空格，可以自动识别出来。

尾注为 `[^xxx]`、脚注为 `[:xxx]`、术语表为 `[]{xxx}`，尾注显示在文章末尾，脚注显示在每个一级标题划分的章节的末尾，术语表只有在启用属于块才会显示。
也可以使用 `[www][^xxx]` 与 `[www][:xxx]` 来标注词组 www 的标注。

值得注意的是，术语表和锚点的语法相同，因为大部分时候术语表也要进行跳转，所以两个语法进行了统一。没有定义的术语只是锚点。

新增了一些语法：`[color]xxx[/]` 这里 color 为颜色代码，支持如下这些颜色：

-	red
-	blue
-	green
-	yellow
-	gold
-	white
-	silver
-	gray
-	dark
-	black

此外，MarkUp 还支持 FontAwesome 图标，语法为：`:fa-icon:`。

## FORM 功能

按钮：`<<xxx>>{name}`；单选按钮 `(()){name}[xxx]`，如果默认选中则为 `((x)){name:value}[xxxx]`；多选按钮 `[[]]{name:value}`，如果默认选中则为 `[[x]]{name:value}`。单选与多选按钮如果 value 不写，会自动以序数（从 1 开始）作为 value；如果 name 不写，则继续使用之前的 name。

## 文档数据

可使用 `[xxx]` 的方式直接引用的数据包括（大小写均可）：

-	TOC：目录结构
-	REF：所有有标注词组的尾注和脚注
-	GLOSSARY：术语表
-	LINK：所有连接列表
-	IMAGE：所有图片列表
-	VIDEO：所有视频列表
-	AUDIO：所有音频列表
-	ARCHOR：所有锚点列表
-	KEYWORD：文档关键词列表
-	TITLE：文档标题（非块级）
-	AUTHOR：文档作者（非块级）
-	EMAIL：文档联系右键地址（非块级，可作为引用地址）
-	DATE：文档更新时间（非块级）