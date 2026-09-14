/**
 * 生成站点默认社交分享卡 public/social-card.png（1200x630）
 * 风格与文章 OG 图保持一致。
 *
 * 用法：node scripts/gen-social-card.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import satori from "satori";
import { html } from "satori-html";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = (p) => path.join(__dirname, "..", "src", "assets", p);
const read = (p) => readFileSync(assets(p));

// 站点信息（与 src/site.config.ts 保持一致）
const SITE_TITLE = "我的博客";
const SITE_AUTHOR = "博主";
const SITE_TAGLINE = "记录技术学习、项目开发和生活感悟";

const markup = html`<div tw="flex flex-col w-full h-full bg-[#1d1f21] text-[#c9cacc]">
	<div tw="flex flex-col flex-1 w-full px-16 justify-center">
		<h1 tw="text-7xl font-bold text-white mb-6">${SITE_TITLE}</h1>
		<p tw="text-3xl text-[#9d9fa1]">${SITE_TAGLINE}</p>
	</div>
	<div tw="flex items-center justify-between w-full px-10 py-8 border-t-2 border-[#2bbc89] text-white">
		<p tw="text-2xl ml-3 font-semibold">${SITE_TITLE}</p>
		<p tw="text-2xl">by ${SITE_AUTHOR}</p>
	</div>
</div>`;

const svg = await satori(markup, {
	width: 1200,
	height: 630,
	fonts: [
		{ data: read("roboto-mono-regular.ttf"), name: "Roboto Mono", weight: 400, style: "normal" },
		{ data: read("roboto-mono-700.ttf"), name: "Roboto Mono", weight: 700, style: "normal" },
		{ data: read("noto-sc-r.ttf"), name: "Noto Sans SC", weight: 400, style: "normal" },
		{ data: read("noto-sc-b.ttf"), name: "Noto Sans SC", weight: 700, style: "normal" },
	],
});

const out = path.join(__dirname, "..", "public", "social-card.png");
await sharp(Buffer.from(svg)).png().toFile(out);
console.log("social-card.png generated:", out);
