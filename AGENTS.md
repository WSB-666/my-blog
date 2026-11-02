# 翠速小筑（Hugo + Dream）

基于 [Hugo](https://gohugo.io/) 与 [Dream](https://github.com/g1eny0ung/hugo-theme-dream) 的中文个人博客。

## 常用命令

```bash
hugo server                                     # 本地开发，默认 http://localhost:1313/
hugo --destination docs --cleanDestinationDir    # 构建，产物写入 docs/
```

Hugo 可执行文件在本机安装于 `~/.local/bin/hugo`（版本 0.169 extended）。

## 写文章

在 `content/posts/` 新建 `.md`，**文件名即 URL 的 slug**（`post5.md` → `/posts/post5/`）。

```yaml
title: "标题"
description: "一句话摘要，显示在首页卡片"
date: 2026-11-02T12:00:00+08:00
tags: [ROS2, 定位]
cover: /my-blog/img/covers/post5.jpg
```

> ⚠️ `cover` 必须带 `/my-blog/` 前缀——主题直接输出该路径，不会自动加子目录。
> 缺 `date` 会导致排序和时间显示异常；缺 frontmatter 不会构建失败，但页面标题会退化成文件名。

## 发布

```bash
hugo --destination docs --cleanDestinationDir
git add -A && git commit -m "post: 新文章"
git push
```

GitHub Pages 从 `main` 分支的 `docs/` 目录发布：https://wsb-666.github.io/my-blog/

> 本站固定部署在仓库子路径 `/my-blog/`，`config.toml` 的 `baseURL` 已写死，不要清空。
