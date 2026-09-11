/**
 * 快照协议层 v2:多供应商 + 通用组件(widgets)校验与格式化。
 * 与 wasm 插件 snapshot.rs 的 Snapshot 契约一一对应。
 */

export const SNAPSHOT_VERSION = 2

export const PROVIDER_STATUSES = ['ok', 'stale', 'error', 'unconfigured']
export const FRESHNESSES = ['current', 'cached', 'unavailable']

const COLOR_GRAY = '#8a8a8a'

/** 校验快照:v 不匹配整帧拒绝 */
export function validateSnapshot(obj) {
  if (!obj || typeof obj !== 'object') return null
  if (obj.v !== SNAPSHOT_VERSION) return null
  if (typeof obj.generatedAt !== 'number') return null
  if (FRESHNESSES.indexOf(obj.freshness) < 0) return null
  const providers = []
  if (Array.isArray(obj.providers)) {
    for (const p of obj.providers) {
      if (!p || typeof p !== 'object') continue
      providers.push({
        id: typeof p.id === 'string' ? p.id : '',
        name: typeof p.name === 'string' ? p.name : (p.id || ''),
        accent: typeof p.accent === 'string' ? p.accent : '#4D6BFE',
        status: PROVIDER_STATUSES.indexOf(p.status) >= 0 ? p.status : 'unconfigured',
        statusText: typeof p.statusText === 'string' ? p.statusText : '',
        balance: p.balance && typeof p.balance === 'object' ? p.balance : null,
        widgets: Array.isArray(p.widgets)
          ? p.widgets
              .filter(w => w && typeof w === 'object' && typeof w.value === 'string')
              .map(w => ({
                type: typeof w.type === 'string' ? w.type : 'note',
                label: w.label,
                value: w.value,
                hint: w.hint,
                percent: w.percent,
                series: Array.isArray(w.series) ? w.series : null,
                seriesLabels: Array.isArray(w.seriesLabels) ? w.seriesLabels : null,
                group: typeof w.group === 'string' ? w.group : '',
                tableColumns: Array.isArray(w.tableColumns)
                  ? w.tableColumns.filter((x) => typeof x === 'string')
                  : null,
                tableRows: Array.isArray(w.tableRows)
                  ? w.tableRows
                      .filter((r) => r && typeof r === 'object' && typeof r.name === 'string')
                      .map((r) => ({
                        name: r.name,
                        cells: Array.isArray(r.cells)
                          ? r.cells.filter((c) => typeof c === 'string')
                          : [],
                      }))
                  : null,
                color: w.color,
                colors: Array.isArray(w.colors)
                  ? w.colors.filter((x) => typeof x === 'string')
                  : null,
              }))
          : [],
        // 插件预设 template.band 透传的显示规则(手环端 merge 的中间层)
        display: p.display && typeof p.display === 'object' ? p.display : null,
      })
    }
  }
  return {
    v: obj.v,
    generatedAt: obj.generatedAt,
    freshness: obj.freshness,
    providers,
  }
}

/** widget 百分比裁剪到 0-100 */
export function clampPercent(v) {
  const n = typeof v === 'number' && isFinite(v) ? v : 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** 余额大字动态字号(按文本长度) */
export function balanceSizeClass(text) {
  const len = typeof text === 'string' ? text.length : 0
  if (len <= 7) return 'hero-f48'
  if (len <= 9) return 'hero-f40'
  if (len <= 11) return 'hero-f32'
  return 'hero-f28'
}

export function minutesAgo(unixSec) {
  if (typeof unixSec !== 'number' || !isFinite(unixSec)) return null
  const diff = Math.floor(Date.now() / 1000) - unixSec
  return diff > 0 ? Math.floor(diff / 60) : 0
}

export function formatClockHM(now) {
  const pad = n => (n < 10 ? '0' + n : String(n))
  return pad(now.getHours()) + ':' + pad(now.getMinutes())
}

/** 供应商状态点颜色 */
export function statusColor(status) {
  switch (status) {
    case 'ok': return '#67ce91'
    case 'stale': return '#f5c344'
    case 'error': return '#ff7e7e'
    default: return COLOR_GRAY
  }
}
