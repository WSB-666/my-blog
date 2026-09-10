import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    // TODO: 部署前改成你自己的网址
    url: "https://example.com/",
    // 网站名称（显示在浏览器标签页和页头）
    title: "我的博客",
    description: "一个简洁、响应式且对 SEO 友好的个人博客。",
    // TODO: 改成你的名字或昵称
    author: "博主",
    // 作者主页链接（可选，不需要可以删除这一行）
    // profile: "https://example.com",
    ogImage: "default-og.jpg",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    // 文章页的“编辑本页”链接。需要时设为 enabled: true，
    // 并把 url 改成你自己仓库的编辑地址。
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  // 页头/页脚显示的社交账号，把链接换成你自己的；不需要的整行删除
  socials: [
    { name: "github",   url: "https://github.com/your-username" },
    { name: "x",        url: "https://x.com/your-username" },
    { name: "linkedin", url: "https://www.linkedin.com/in/your-username/" },
    { name: "mail",     url: "mailto:yourmail@gmail.com" },
  ],
  // 文章页底部的分享按钮
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
