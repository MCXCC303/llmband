/**
 * 峰谷配色规则 —— 纯逻辑(无 IO,可单测)。
 *
 * 规则完全由**模板预设**决定(表盘不提供任何设置):
 *   - 插件预设 JSON:template.band.clock(随快照 display 透传,唯一来源)
 * 预设未声明 clock → 该供应商不启用峰谷配色,时钟恒为白色。
 * 判定见 common/pricing.js 的 isPeakActive(date, rule)。
 *
 * rule 形状:{ enabled, windows: [[开始,结束),...](至多 2 段), dayMode }
 *   enabled  默认 true(预设声明 clock 即代表启用;可显式 false 关闭)
 *   dayMode  'daily' 每天 | 'weekdays' 仅工作日(周末非高峰) | 'weekend' 仅周末
 */

export const DAY_MODES = ['daily', 'weekdays', 'weekend']
export const DAY_MODE_LABELS = {
  daily: '每天',
  weekdays: '仅工作日(周一~五)',
  weekend: '仅周末(周六日)',
}

/** 缺省时段(仅当预设声明了 clock 却漏写 windows 时兜底;新预设请显式声明自己的时段。
 *  历史默认 09-12/14-18 沿用 DeepSeek 预设,不作为通用语义) */
export function defaultWindows() {
  return [[9, 12], [14, 18]]
}

function normHour(v, lo, hi, fb) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fb
}

/**
 * 把预设声明的 clock(raw)收敛为合法规则(仅用于"已声明"的输入,
 * 调用方负责判断是否声明):字段缺失/越界回退,不抛错。
 */
export function sanitizeClockRule(raw) {
  const wins = defaultWindows().map((w) => [w[0], w[1]])
  if (!raw || typeof raw !== 'object') {
    return { enabled: true, windows: wins, dayMode: 'daily' }
  }
  const out = {
    enabled: raw.enabled !== false,
    windows: [],
    dayMode: DAY_MODES.indexOf(String(raw.dayMode || '')) >= 0 ? String(raw.dayMode) : 'daily',
    // 峰/谷颜色(可选):{ peak, valley } 十六进制;缺省用定价模块常量
    colors: null,
  }
  const rc = raw.colors && typeof raw.colors === 'object' ? raw.colors : null
  if (rc) {
    const pick = (v) => (typeof v === 'string' && v.charAt(0) === '#' ? v : null)
    const peak = pick(rc.peak)
    const valley = pick(rc.valley)
    if (peak || valley) out.colors = { peak: peak || null, valley: valley || null }
  }
  const src = Array.isArray(raw.windows) ? raw.windows : []
  for (const w of src.slice(0, 2)) {
    if (!Array.isArray(w) || w.length < 2) continue
    let s = normHour(w[0], 0, 23, 0)
    let e = normHour(w[1], 1, 24, 24)
    if (e <= s) e = Math.min(24, s + 1)
    out.windows.push([s, e])
    if (out.windows.length === 2) break
  }
  if (!out.windows.length) out.windows = wins
  return out
}

export function pad2(n) {
  const v = Math.max(0, Math.min(24, Math.round(n)))
  return (v < 10 ? '0' : '') + String(v)
}

/** 时段文案,如 "09-12 · 14-18"(日志/文档用) */
export function fmtWindows(windows) {
  return windows.map((w) => pad2(w[0]) + '-' + pad2(w[1])).join(' · ')
}
