import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rootDir = process.cwd()
const coverageDir = resolve(rootDir, 'coverage')
const summaryPath = resolve(coverageDir, 'coverage-summary.json')
const markdownPath = resolve(coverageDir, 'COVERAGE_ZH.md')

if (!existsSync(summaryPath)) {
  console.error('未找到 coverage-summary.json，请先执行覆盖率测试。')
  process.exit(1)
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'))
const total = summary.total

const formatPct = (value) => `${Number(value).toFixed(2)}%`

const fileEntries = Object.entries(summary)
  .filter(([key]) => key !== 'total')
  .map(([file, metrics]) => ({
    file: file.replaceAll('\\', '/'),
    statements: metrics.statements.pct,
    branches: metrics.branches.pct,
    functions: metrics.functions.pct,
    lines: metrics.lines.pct
  }))
  .sort((a, b) => a.lines - b.lines)

const lowCoverageFiles = fileEntries.filter((item) => item.lines < 80).slice(0, 10)

const summaryLines = [
  '覆盖率摘要',
  `- 语句覆盖率：${formatPct(total.statements.pct)}`,
  `- 分支覆盖率：${formatPct(total.branches.pct)}`,
  `- 函数覆盖率：${formatPct(total.functions.pct)}`,
  `- 行覆盖率：${formatPct(total.lines.pct)}`
]

const lowCoverageLines =
  lowCoverageFiles.length > 0
    ? [
        '',
        '覆盖率较低文件（按行覆盖率升序，最多 10 个）',
        ...lowCoverageFiles.map(
          (item) =>
            `- ${item.file}：行 ${formatPct(item.lines)}，语句 ${formatPct(item.statements)}，分支 ${formatPct(item.branches)}，函数 ${formatPct(item.functions)}`
        )
      ]
    : ['', '所有文件的行覆盖率均达到 80% 及以上。']

const output = [...summaryLines, ...lowCoverageLines].join('\n')

console.log(`\n${output}\n`)

mkdirSync(coverageDir, { recursive: true })
writeFileSync(markdownPath, `${output}\n`, 'utf-8')

console.log(`中文覆盖率摘要已生成：${markdownPath}`)
