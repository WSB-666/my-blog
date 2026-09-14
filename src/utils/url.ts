/**
 * 给站内路径补上 base 前缀，适配 GitHub Pages 子目录部署。
 *
 * base 为 "/my-blog/" 时：withBase("/posts/") -> "/my-blog/posts/"
 * 未配置 base（BASE_URL 为 "/"）时原样返回 "/posts/"
 */
export function withBase(path: string): string {
	return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
