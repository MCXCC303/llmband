/**
 * 峰谷规则与时钟配色 —— 纯逻辑(北京时间语义,可脱离快应用环境单测)。
 *
 * 通用机制:预设声明 clock(是否启用 / 高峰时段 / 高峰日)后,高峰染橘红、
 * 非高峰染绿;未声明则时钟保持白色。规则对象见 common/peak-config.js。
 * 本模块不含任何供应商特定常量(历史上曾含价格生效日期,已移除)。
 */

const BEIJING_OFFSET_MS = 8 * 3600 * 1000

// 时钟文本配色(峰谷启用时):高峰橘红 / 非高峰(谷时)绿;关闭峰谷时保持白
export const CLOCK_PEAK_COLOR = '#ff6b4a'
export const CLOCK_VALLEY_COLOR = '#67ce91'
export const CLOCK_NORMAL_COLOR = '#ffffff'

/** 北京时间小时(0-23,与设备时区无关) */
export function beijingHour(date) {
  return new Date(date.getTime() + BEIJING_OFFSET_MS).getUTCHours()
}

/** 北京日历日的星期(0=周日 ... 6=周六) */
export function beijingDay(date) {
  return new Date(date.getTime() + BEIJING_OFFSET_MS).getUTCDay()
}

/** 高峰日是否放行:daily 每天;weekdays 仅工作日(周一~五);weekend 仅周末 */
export function dayAllowed(day, mode) {
  if (mode === 'weekdays') return day >= 1 && day <= 5
  if (mode === 'weekend') return day === 0 || day === 6
  return true
}

/**
 * 按策略判定当前是否为高峰(时钟染橘红的时刻)。
 * policy: { enabled: boolean,
 *           windows: [[startHour, endHour), ...]  // 半开区间,至多 2 段
 *           dayMode: 'daily' | 'weekdays' | 'weekend' }
 */
export function isPeakActive(date, policy) {
  if (!(date instanceof Date)) date = new Date(date)
  if (!policy || policy.enabled === false) return false
  const wins = Array.isArray(policy.windows) ? policy.windows : []
  const hour = beijingHour(date)
  let inWindow = false
  for (const w of wins) {
    if (Array.isArray(w) && w.length >= 2 && hour >= w[0] && hour < w[1]) {
      inWindow = true
      break
    }
  }
  return inWindow && dayAllowed(beijingDay(date), policy.dayMode || 'daily')
}

