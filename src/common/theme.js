/**
 * 手环框架的「样式/排版约束目录」——预设套接的地基。
 *
 * 视觉体系仿照 DSBand:区块标题 + 分隔留白 + 居中排版;
 * 组件库:balance(数值大字)/ kv / bar(进度条)/ ring(环状图)/
 *         bars(柱状图)/ stack(占比堆叠)/ hbar(横置条形图)/ note。
 *
 * 字号基准与 DSBand 对齐(最小正文 15-16px,大数字 24-64px 自适应);
 * 所有字号/尺寸都是 token,套接模板开发者可通过
 *   widgetStyles.<type>.xxx 覆盖(如 bars.labelSize / ring.ringSize)。
 * 合并顺序:框架默认 < 快照 display(插件 template.band;唯一来源)。
 */

// DSBand 基础色板
const COLOR_BG_TRACK = '#2a2d33'
const COLOR_LABEL = '#8a8a8a'
const COLOR_BODY = '#c9ced6'
const COLOR_VALUE = '#ffffff'

export const DSBAND_COLORS = { track: COLOR_BG_TRACK, label: COLOR_LABEL, body: COLOR_BODY, value: COLOR_VALUE }

export const DEFAULT_THEME = {
  accent: '#4D6BFE',
  // 大数字尺寸:"auto"(按文本长度自适应 DSBand 64→28 体系)| "f64".."f28"
  heroSize: 'auto',
  // 组件标签行是否显示
  showSectionTitle: true,
  // 文本颜色 token(开发者可覆盖;缺省即当前样式):标签/大数值/说明/行数值
  labelColor: '#8a8a8a',
  valueColor: '#ffffff',
  hintColor: '#8a8a8a',
  rowColor: '#c9ced6',
}

// DSBand 字号体系(px):标签 18-20 / 正文 16 / 图头大数字 34(超长自动收缩)
const F = {
  label: 18, // 居中组件标签(灰)
  kv: 19, // 键值行字号
  bigValue: 34, // 图头大数字(bar/bars/stack/hbar/ring 中心)
  hint: 16,
  note: 16,
  anchor: 15, // 柱状图日期锚点
  ringLabel: 16,
  hbarRow: 16, // 横置条形图行内标签/数值
  stackHint: 15,
}

export const DEFAULT_WIDGET_STYLES = {
  balance: { size: 'auto' },
  kv: { fontSize: F.kv, spacing: 10 },
  bar: { labelSize: F.label, valueSize: F.bigValue, height: 12, radius: 6 },
  ring: { labelSize: F.label, valueSize: 24, size: 118, stroke: 8 },
  // 占比圆环(每模型一个环,弧长=占总量比例):小环 + 名称/数值列
  ringshare: { size: 64, stroke: 6, maxItems: 6, nameSize: 21, subSize: 17 },
  // 单环分段(一整圈 = 总量,各模型弧段顺次拼接)
  ringseg: { size: 128, stroke: 12, maxItems: 6 },
  bars: {
    labelSize: F.label,
    valueSize: F.bigValue,
    height: 60,
    gap: 4,
    radius: 3,
    count: 7,
    showLabels: true,
    anchorSize: F.anchor,
  },
  stack: { labelSize: F.label, valueSize: F.bigValue, height: 12, radius: 6, maxSegs: 6, hintSize: F.stackHint },
  hbar: {
    labelSize: F.label,
    valueSize: F.bigValue,
    height: 8,
    radius: 4,
    maxRows: 3, // 真机卡顿→卸载重装崩溃;行数受限(实验值 3)后稳定
    rowFont: F.hbarRow,
    rowFont: F.hbarRow,
    hintSize: F.stackHint,
  },
  note: { fontSize: F.note },
}

export const DEFAULT_LAYOUT = {
  maxWidgets: 24,
  // 未知组件类型的兜底:true=渲染为 note 提示;false=直接丢弃
  unknownAsNote: true,
  // 区块间隔(px,DSBand 风格留白)
  sectionGap: 16,
  // 同一板块(group)内相邻组件的紧凑行距(px)
  groupRowGap: 8,
  // 同板块内连续 kv 行的行距(px,如充值/赠送,近似 DSBand 今日消费两行文本)
  kvRowGap: 2,
  // 区块之间是否绘制细分隔线(DSBand divider 风格)
  showDividers: true,
  // 内容水平内边距(px)
  contentPaddingX: 16,
}

/** 深合并(仅对象层级;数组/标量整体替换。null/undefined/标量 一律忽略,保持 base——避免空 display 把主题合并成 null) */
function mergeDeep(base, override) {
  if (override === undefined) return base
  if (Array.isArray(override)) return override
  if (!override || typeof override !== 'object') return base
  if (!base || typeof base !== 'object' || Array.isArray(base)) {
    return Object.assign({}, override)
  }
  const out = Object.assign({}, base)
  for (const k of Object.keys(override)) {
    out[k] = mergeDeep(base[k], override[k])
  }
  return out
}

/** 数值约束收敛到合法区间(防止预设把排版撑爆) */
function clampNum(v, min, max, fallback) {
  const n = typeof v === 'number' && isFinite(v) ? v : fallback
  return Math.max(min, Math.min(max, n))
}

function clampFont(ws, key, min, max) {
  if (typeof ws[key] === 'number') {
    ws[key] = Math.max(min, Math.min(max, ws[key]))
  }
}

/**
 * 合并显示规则并收敛约束:框架默认 < 快照 display(插件 template.band 透传)。
 * 本地不再维护供应商注册表(供应商内容单一来源 = 插件预设)。
 * @param providerDisplay 快照里由插件预设 template.band 带过来的规则(可为空)
 */
export function resolveTheme(providerDisplay) {
  const raw = mergeDeep(
    {
      theme: DEFAULT_THEME,
      widgetStyles: DEFAULT_WIDGET_STYLES,
      layout: DEFAULT_LAYOUT,
    },
    providerDisplay || null
  )
  // 收敛约束:尺寸与字号都限制在可读/不越界区间
  const ws = raw.widgetStyles || {}
  const sizes = {
    bar: { height: [8, 24], radius: [2, 12] },
    bars: { height: [24, 110], gap: [1, 10], count: [2, 14], radius: [1, 8] },
    ring: { size: [80, 170], stroke: [4, 16] },
    ringshare: { size: [48, 110], stroke: [3, 12], maxItems: [1, 8] },
    ringseg: { size: [80, 170], stroke: [4, 16], maxItems: [1, 8] },
    stack: { height: [8, 24], radius: [2, 12], maxSegs: [2, 8] },
    // 真机安全:行类组件上限 3 行(6+ 行卡顿→卸载重装崩;3 行稳定);预设不可突破
    hbar: { height: [4, 16], radius: [2, 8], maxRows: [1, 3] },
    kv: { fontSize: [16, 26], spacing: [4, 20] },
    note: { fontSize: [14, 24] },
  }
  for (const k of Object.keys(sizes)) {
    if (!ws[k]) ws[k] = {}
    for (const [prop, [lo, hi]] of Object.entries(sizes[k])) {
      const cur = ws[k][prop]
      if (typeof cur === 'number') ws[k][prop] = Math.max(lo, Math.min(hi, cur))
    }
  }
  // 字号 token(标签/大数字/锚点/hint/行)
  for (const kind of ['bar', 'ring', 'bars', 'stack', 'hbar']) {
    if (!ws[kind]) ws[kind] = {}
    clampFont(ws[kind], 'labelSize', 14, 24)
    clampFont(ws[kind], 'valueSize', 20, 44)
  }
  if (ws.bars) clampFont(ws.bars, 'anchorSize', 12, 20)
  if (ws.stack) clampFont(ws.stack, 'hintSize', 13, 20)
  if (ws.hbar) {
    clampFont(ws.hbar, 'rowFont', 14, 22)
    clampFont(ws.hbar, 'hintSize', 13, 20)
  }
  if (ws.ringshare) {
    clampFont(ws.ringshare, 'nameSize', 13, 22)
    clampFont(ws.ringshare, 'subSize', 11, 18)
  }
  raw.layout = Object.assign({}, raw.layout)
  raw.layout.maxWidgets = clampNum(raw.layout.maxWidgets, 4, 40, DEFAULT_LAYOUT.maxWidgets)
  raw.layout.sectionGap = clampNum(raw.layout.sectionGap, 4, 32, DEFAULT_LAYOUT.sectionGap)
  raw.layout.groupRowGap = clampNum(raw.layout.groupRowGap, 2, 16, DEFAULT_LAYOUT.groupRowGap)
  raw.layout.kvRowGap = clampNum(raw.layout.kvRowGap, 0, 12, DEFAULT_LAYOUT.kvRowGap)
  return raw
}

