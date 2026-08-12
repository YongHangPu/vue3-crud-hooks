/**
 * 同步根目录 CHANGELOG.md → docs/changelog.md
 * - docs:build / docs:dev 前自动执行,保证文档站更新日志始终与仓库 CHANGELOG 一致
 * - 用法:pnpm sync:changelog
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'CHANGELOG.md')
const dest = join(root, 'docs', 'changelog.md')

const changelog = readFileSync(src, 'utf-8')
// 去掉根文件开头的 "# Changelog" 标题(文档页使用自己的标题)
const body = changelog.replace(/^#\s*Changelog\s*\n?/, '').replace(/\r\n/g, '\n')

const header = [
  '# 更新日志（Changelog）',
  '',
  '> 完整更新记录同步自仓库根目录 [`CHANGELOG.md`](https://github.com/YongHangPu/vue3-crud-hooks/blob/main/CHANGELOG.md)，按版本倒序排列。',
  '',
  '---',
  '',
].join('\n')

mkdirSync(dirname(dest), { recursive: true })
writeFileSync(dest, header + '\n' + body, 'utf-8')
console.log(`✅ 已同步 ${src} → ${dest}`)
