/**
 * 手环框架的「组件渲染注册表」——预设套接的执行层。
 *
 * 视觉体系仿照 DSBand,布局统一为舒展的三段式:
 *   居中标签行 → 居中大数字 → 图形(条/环/柱/堆叠/横置条)
 * 组件:
 * - balance  数值大字(居中标签 + 大数字 + 可选副行)
 * - kv       键值行(左标签 / 右数值,行距舒展)
 * - bar      进度条(居中标签 + 大数字 + 圆角轨道进度条)
 * - ring     环状图(居中标签 + 弧形环,中心大数字)
 * - bars     柱状图(居中标签 + 大数字 + 底对齐圆角柱 + 首/中/末日期锚点)
 * - stack    占比堆叠条(居中标签 + 大数字 + 多段堆叠 + 逐行说明)
 * - hbar     横置条形图(居中标签 + 大数字 + 每项一行水平条:标签/数值/条)
 * - note     提示文本
 *
 * 所有字号/尺寸来自 theme(DSBand 基准,预设可覆盖)。
 * 新增组件类型 = 注册 builder + dashboard.ux 模板加分支。
 */

import { balanceSizeClass } from './snapshot'

const EMPTY = '--'
// DSBand 轨道/底环色
const TRACK = '#2a2d33'
// 主色 → 段色透明度阶梯(深色底上区分段)
const SEG_ALPHAS = [1, 0.72, 0.5, 0.34, 0.24, 0.17, 0.12, 0.08]

/** hex → rgba(供段色/底纹使用) */
function hexToRgba(hex, alpha) {
  let h = String(hex || '').trim()
  if (h.charAt(0) === '#') h = h.slice(1)
  if (h.length === 3) {
    h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2)
  }
  const n = parseInt(h, 16)
  if (!isFinite(n) || h.length !== 6) return null
  return (
    'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')'
  )
}

function numArr(v) {
  if (!Array.isArray(v)) return null
  const out = []
  for (const x of v) {
    if (typeof x === 'number' && isFinite(x)) out.push(x)
    else if (typeof x === 'string' && x.trim() !== '' && isFinite(Number(x))) out.push(Number(x))
    else out.push(0)
  }
  return out.length ? out : null
}

function strArr(v) {
  if (!Array.isArray(v)) return null
  const out = []
  for (const x of v) {
    if (typeof x === 'string' && x !== '') out.push(x)
  }
  return out.length ? out : null
}

/** 大数字自适应档位(余额/图头共用,DSBand 64→28 体系) */
function heroClass(theme, value) {
  if (theme.theme && theme.theme.heroSize && theme.theme.heroSize !== 'auto') {
    return 'hero-' + theme.theme.heroSize
  }
  return balanceSizeClass(value)
}

/** 标签行是否显示 */
function showTitle(theme) {
  return !theme.theme || theme.theme.showSectionTitle !== false
}

const BUILDERS = {
  balance(w, prov, theme) {
    return {
      isBalance: true,
      label: showTitle(theme) ? w.label || '' : '',
      value: w.value,
      hint: w.hint || '',
      color: w.color || theme.theme.accent,
      heroClass: heroClass(theme, w.value),
    }
  },

  kv(w, prov, theme) {
    const st = theme.widgetStyles.kv || {}
    return {
      isKv: true,
      label: w.label || '',
      value: w.value,
      color: w.color || theme.theme.accent,
      fontSize: st.fontSize,
      spacing: st.spacing,
    }
  },

  bar(w, prov, theme) {
    const st = theme.widgetStyles.bar || {}
    return {
      isBar: true,
      label: w.label || '',
      value: w.value,
      hint: w.hint || '',
      color: w.color || theme.theme.accent,
      percent: clampPct(w.percent),
      // 三段式:居中标签 + 大数字 + 条
      labelSize: st.labelSize,
      valueSize: st.valueSize,
      barHeight: st.height,
      barRadius: st.radius,
      track: TRACK,
    }
  },

  ring(w, prov, theme) {
    const st = theme.widgetStyles.ring || {}
    return {
      isRing: true,
      label: w.label || '',
      value: w.value,
      hint: w.hint || '',
      color: w.color || theme.theme.accent,
      percent: clampPct(w.percent),
      labelSize: st.labelSize,
      valueSize: st.valueSize,
      ringSize: st.size,
      stroke: st.stroke,
      track: TRACK,
    }
  },

  bars(w, prov, theme) {
    const st = theme.widgetStyles.bars || {}
    const series = numArr(w.series)
    if (!series) return null
    const labels = strArr(w.seriesLabels)
    const count = Math.min(st.count, series.length)
    const data = series.slice(-count)
    let max = 0
    for (const v of data) {
      if (v > max) max = v
    }
    const gap = st.gap
    const innerGap = gap * (count - 1)
    const wPct = (100 - innerGap) / count
    const bars = data.map((v) => {
      const hPct = max > 0 ? Math.max(4, Math.round((v / max) * 100)) : 4
      return { hPct, wPct: Math.max(1, Math.floor(wPct * 10) / 10), gap }
    })
    // 日期锚点:首/中/末
    let anchors = ['', '', '']
    if (st.showLabels && labels && labels.length) {
      const mids = Math.floor(labels.length / 2)
      anchors = [labels[0] || '', labels[mids] || '', labels[labels.length - 1] || '']
    }
    return {
      isBars: true,
      label: w.label || '',
      value: w.value,
      color: w.color || theme.theme.accent,
      labelSize: st.labelSize,
      valueSize: st.valueSize,
      barsHeight: st.height,
      barRadius: st.radius,
      bars,
      anchors,
      anchorSize: st.anchorSize,
      track: TRACK,
    }
  },

  stack(w, prov, theme) {
    const st = theme.widgetStyles.stack || {}
    const series = numArr(w.series)
    if (!series || series.length < 2) return null
    const data = series.slice(0, st.maxSegs)
    let total = 0
    for (const v of data) total += v
    if (total <= 0) return null
    const base = w.color || theme.theme.accent
    const segs = data.map((v, i) => {
      const alpha = SEG_ALPHAS[i % SEG_ALPHAS.length]
      const bg = alpha >= 1 ? base : hexToRgba(base, alpha) || base
      return { wPct: Math.max(0.5, Math.round((v / total) * 1000) / 10), bg }
    })
    const hintLines = String(w.hint || '')
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s !== '')
    return {
      isStack: true,
      label: w.label || '',
      value: w.value,
      hintLines,
      color: base,
      labelSize: st.labelSize,
      valueSize: st.valueSize,
      stackHeight: st.height,
      stackRadius: st.radius,
      segs,
      hintSize: st.hintSize,
      track: TRACK,
    }
  },

  hbar(w, prov, theme) {
    const st = theme.widgetStyles.hbar || {}
    const series = numArr(w.series)
    if (!series || !series.length) return null
    const labels = strArr(w.seriesLabels)
    const count = Math.min(st.maxRows, series.length)
    const data = series.slice(-count) // 取最近 N 个(与 bars 一致)
    let max = 0
    for (const v of data) {
      if (v > max) max = v
    }
    const rows = []
    for (let i = 0; i < data.length; i++) {
      const v = data[i]
      const wPct = max > 0 ? Math.max(2, Math.round((v / max) * 100)) : 2
      const li = series.length - data.length + i
      rows.push({
        name: labels && labels[li] !== undefined ? labels[li] : '',
        wPct,
        // 行尾数值:0-100 视为百分比(如缓存命中率),其余紧凑显示(K/M)
        text: rowText(v),
      })
    }
    const hintLines = String(w.hint || '')
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s !== '')
    return {
      isHbar: true,
      label: w.label || '',
      value: w.value,
      color: w.color || theme.theme.accent,
      labelSize: st.labelSize,
      valueSize: st.valueSize,
      rows,
      rowFont: st.rowFont,
      barHeight: st.height,
      barRadius: st.radius,
      hintLines,
      hintSize: st.hintSize,
      track: TRACK,
    }
  },

  // 占比圆环:每模型一个小圆环。默认弧长 = 占总量比例(100% = 总量);
  // rate 模式(插件预设 rate:true)下 series 是每个模型 0-100 的比率,弧长 = 该值本身
  // (如"当日模型缓存率"),不做占比归一化。
  ringshare(w, prov, theme) {
    const st = theme.widgetStyles.ringshare || {}
    const series = numArr(w.series)
    if (!series || !series.length) return null
    const isRate = w.rate === true
    const labels = strArr(w.seriesLabels)
    const count = Math.min(st.maxItems || 6, series.length)
    let total = 0
    if (!isRate) {
      for (let i = 0; i < count; i++) {
        if (series[i] > 0) total += series[i]
      }
      if (total <= 0) return null
    }
    const base = w.color || theme.theme.accent
    const items = []
    for (let i = 0; i < count; i++) {
      const v = series[i]
      if (v <= 0) continue
      // rate 模式:该模型比率本身(整数百分比);占比模式:归一化到总量
      const pct = isRate ? clampPct(v) : Math.round((v / total) * 100) // 环内数值保留整数
      const color = segColor(w, items.length, base)
      items.push({
        name: labels && labels[i] !== undefined ? labels[i] : '',
        pct,
        text: String(pct) + '%',
        // rate 模式的副行会与环内百分比重复 → 留空(信息行只显示模型名)
        sub: isRate ? '' : rowText(v),
        color,
      })
    }
    if (!items.length) return null
    return {
      isRingShare: true,
      label: w.label || '',
      value: w.value,
      ringSize: st.size,
      stroke: st.stroke,
      items,
    }
  },

  // 单环分段:宿主 progress(arc)原生支持 start-angle / total-angle,
  // 每段一个弧:起点角 = 前段累计角,张角 = 该段占比 × 360°,整圈 = 100% = 总量。
  // 各段自带轨道只落在自身张角内,不会盖住前段;无需 transform 旋转。
  ringseg(w, prov, theme) {
    const st = theme.widgetStyles.ringseg || {}
    const series = numArr(w.series)
    if (!series || !series.length) return null
    const labels = strArr(w.seriesLabels)
    const count = Math.min(st.maxItems || 6, series.length)
    let total = 0
    for (let i = 0; i < count; i++) {
      if (series[i] > 0) total += series[i]
    }
    if (total <= 0) return null
    const base = w.color || theme.theme.accent
    const size = st.size
    const items = []
    const legend = []
    let acc = 0 // 累计角度(度)
    let idx = 0
    for (let i = 0; i < count; i++) {
      const v = series[i]
      if (v <= 0) continue
      const share = v / total
      const pct = Math.round(share * 1000) / 10
      const start = Math.round(acc * 10) / 10
      let sweep = Math.round(share * 360 * 10) / 10
      acc += share * 360
      const color = segColor(w, idx, base)
      const name = labels && labels[i] !== undefined ? labels[i] : ''
      items.push({ start, sweep, pct, color })
      legend.push({ color, text: (name ? name + ' ' : '') + String(pct) + '%' })
      idx++
    }
    if (!items.length) return null
    // 末段收口到 360°,避免浮点累积误差留下缺口
    const last = items[items.length - 1]
    last.sweep = Math.round((360 - last.start) * 10) / 10
    return {
      isRingSeg: true,
      label: w.label || '',
      value: w.value,
      size,
      stroke: st.stroke,
      items,
      legend,
    }
  },

  // 表格:真机行数受限(实验:6 行卡顿到卸载重装崩;3 行内稳定)
  table(w, prov, theme) {
    return {
      isTable: true,
      label: w.label || '',
      tableColumns: Array.isArray(w.tableColumns) ? w.tableColumns : [],
      tableRows: Array.isArray(w.tableRows) ? w.tableRows.slice(0, 3) : [],
    }
  },

  note(w, prov, theme) {
    const st = theme.widgetStyles.note || {}
    return {
      isNote: true,
      value: w.value,
      fontSize: st.fontSize,
    }
  },
}

/** hbar 行尾数值文本:0-100 按百分比,其余紧凑(K/M) */
function rowText(v) {
  if (v >= 0 && v <= 100) {
    const s = String(Math.round(v * 10) / 10)
    return s + '%'
  }
  const a = Math.abs(v)
  if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (a >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return String(Math.round(v))
}

/** 分段/占比组件取色:预设 colors[i] 优先,缺省用 accent 透明度阶梯 */
function segColor(w, i, base) {
  const cs = Array.isArray(w.colors) ? w.colors : []
  const c = cs[i]
  if (typeof c === 'string' && c) return c
  const alpha = SEG_ALPHAS[i % SEG_ALPHAS.length]
  return alpha >= 1 ? base : hexToRgba(base, alpha) || base
}

function clampPct(v) {
  const n = typeof v === 'number' && isFinite(v) ? v : 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function makeNote(text, theme) {
  const st = theme.widgetStyles.note || {}
  return { isNote: true, value: text, fontSize: st.fontSize }
}

/**
 * 把一个供应商的 widgets 渲染成视图模型。
 * @param provider  快照中的供应商(含 display 规则,由插件预设 template.band 带来)
 * @param theme     resolveTheme() 合并后的样式/排版约束
 */
export function buildWidgetItems(provider, theme) {
  const items = []
  const showDividers = !theme.layout || theme.layout.showDividers !== false
  let lastGroup = null
  let lastType = null
  const list = provider.widgets
  for (let i = 0; i < list.length; i++) {
    const w = list[i]
    if (!w || typeof w !== 'object') continue
    const b = BUILDERS[w.type]
    let item = null
    if (!b) {
      if (theme.layout.unknownAsNote) {
        item = makeNote('未知组件类型: ' + w.type, theme)
      }
    } else {
      item = b(w, provider, theme)
    }
    if (!item) continue
    // 颜色 token 兜底:未指定时等于框架默认(保持现样式);开发者可用
    // theme.labelColor/valueColor/hintColor/rowColor 覆盖(快照 display 随插件透传)
    const th = theme.theme || {}
    if (item.labelColor === undefined) item.labelColor = th.labelColor || '#8a8a8a'
    if (item.valueColor === undefined) item.valueColor = th.valueColor || '#ffffff'
    if (item.hintColor === undefined) item.hintColor = th.hintColor || '#8a8a8a'
    if (item.rowColor === undefined) item.rowColor = th.rowColor || '#c9ced6'
    // 区块组:与上一个渲染组件同组时不画分隔线,且行距收窄(groupRowGap)
    // (如"充值/赠送"同板块连续行、数值+图表连排)
    const g = typeof w.group === 'string' ? w.group : ''
    const sameGroup = g !== '' && g === lastGroup
    item.group = g
    // 同板块内连续 kv 行用 kvRowGap(充值/赠送式两行文本),其余用 groupRowGap
    let gapVal = theme.layout.sectionGap
    if (sameGroup) {
      gapVal = w.type === 'kv' && lastType === 'kv' ? theme.layout.kvRowGap : theme.layout.groupRowGap
    }
    item.gapBefore = gapVal
    // 分隔线画在板块边界:与下一组件不同组(同组相邻不画;末组件不画)
    let divider = false
    if (showDividers) {
      const next = list[i + 1]
      const ng = next && typeof next.group === 'string' ? next.group : ''
      divider = !!next && ng !== g
    }
    item.showDivider = divider
    lastGroup = g
    lastType = w.type
    items.push(item)
    if (items.length >= theme.layout.maxWidgets) break
  }
  return items
}