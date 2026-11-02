# 翠速小筑

基于 Hugo + [Dream](https://github.com/g1eny0ung/hugo-theme-dream) 主题的中文个人博客。

🌐 线上地址：<https://wsb-666.github.io/my-blog/>

## 常用命令

```bash
hugo server            # 本地开发（默认 http://localhost:1313/）
hugo --destination docs --cleanDestinationDir   # 构建，产物写入 docs/
```

> 本站部署在 GitHub Pages 的子路径 `/my-blog/`，构建时必须以仓库根目录为基准，
> `config.toml` 里的 `baseURL` 已经固定好，直接执行上面的构建命令即可。

## 怎么写新文章

在 `content/posts/` 下新建 `.md` 文件，**文件名就是 URL 的最后一段**：

```
content/posts/post5.md  →  https://wsb-666.github.io/my-blog/posts/post5/
```

每个文件必须有 frontmatter：

```yaml
title: "文章标题"
description: "一句话摘要，显示在首页卡片上"
date: 2026-11-02T12:00:00+08:00
tags:
  - ROS2
  - 定位
cover: /my-blog/img/covers/post5.jpg
```

- `date`：必填，决定排序
- `description`：首页卡片摘要（优先于正文）
- `cover`：封面图，需带 `/my-blog/` 前缀（主题直接引用路径，不做相对处理）
- `draft: true`：草稿
- `lastmod`：最后更新时间

正文里可以用 `<!--more-->` 控制列表页正文截断。

## 封面上传

把图片放进 `static/img/covers/`，在 frontmatter 里写
`cover: /my-blog/img/covers/<文件名>`。

## 发布

```bash
hugo --destination docs --cleanDestinationDir
git add -A && git commit -m "post: 新文章"
git push
```

GitHub Pages 从 `main` 分支的 `docs/` 目录发布，推送后 1~2 分钟自动生效。

## 主题说明

主题源码在 `themes/dream/`，遵循 Apache-2.0 协议。升级主题时替换该目录即可，
但注意不要覆盖 `config.toml`、`content/`、`static/`。
