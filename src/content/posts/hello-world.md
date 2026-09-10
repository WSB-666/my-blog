---
title: 你好，世界：我的第一篇博客
author: 博主
pubDatetime: 2026-09-10T09:00:00.000+08:00
featured: true
draft: false
tags:
  - 随笔
  - 博客
description: "这是博客的第一篇文章，演示如何用 Markdown 写文章。你可以随时编辑或删除它。"
---

> 这是一篇**示例文章**，用来演示文章格式。欢迎随时编辑或删除它，然后开始写你自己的内容！

## 怎么写新文章

在 `src/content/posts/` 文件夹里新建一个 `.md` 文件，文件名就是文章网址的一部分（例如 `my-first-post.md` 的网址是 `/posts/my-first-post`）。

每个文件最上方两条 `---` 之间是**文章信息**：

- `title`：文章标题
- `pubDatetime`：发布时间
- `tags`：标签（可以写多个）
- `description`：文章摘要，会显示在列表和搜索引擎中
- `draft: true`：存为草稿，不会发布
- `featured: true`：设为精选文章，显示在首页最上方

## Markdown 常用语法

正文使用 Markdown 书写，下面是一些常用写法：

### 文字样式

**这是粗体**，*这是斜体*，`这是行内代码`。

### 列表

无序列表：

- 第一项
- 第二项
- 第三项

有序列表：

1. 第一步
2. 第二步
3. 第三步

### 引用

> 这是一段引用文字。

### 代码块

```python
def hello():
    print("你好，世界！")
```

### 链接

[这是一个链接](https://astro.build)。

---

准备好了就删掉这篇文章，开始你的写作吧 🎉
