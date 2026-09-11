/** 演示数据客户端(开发/离线预览用,cfg.mock=true 才启用;生产链路 mock=false,
 *  渲染完全由插件推送的快照驱动,不依赖本文件)。场景数据镜像当前插件预设模板,
 *  仅用于本地开发时预览组件效果,供应商内容随预设更新即可。 */

import { validateSnapshot } from './snapshot'

export const FORCE_MOCK = false

let handlers = null
let mockScene = 1
let timer = null
let requestedClose = true

function mockSnapshot(scene) {
  const now = Math.floor(Date.now() / 1000)
  const list = [
    {
      // 场景 1:两个供应商,数据新鲜
      v: 2,
      generatedAt: now,
      freshness: 'current',
      providers: [
        {
          id: 'deepseek',
          name: 'DeepSeek',
          accent: '#4D6BFE',
          status: 'ok',
          statusText: '已连接',
          balance: { total: 128.47, topUp: 118, granted: 10.47, currency: 'CNY', checkedAt: now },
          // 插件预设 template.band 透传的显示规则(与 wasm/presets/deepseek.json 对应)
          display: {
            theme: { accent: '#4D6BFE', heroSize: 'auto' },
            widgetStyles: { bars: { height: 56, gap: 3, count: 7 }, hbar: { height: 6, radius: 3, maxRows: 7 } },
            clock: { enabled: true, windows: [[9, 12], [14, 18]], dayMode: 'weekdays' },
          },
          widgets: [
            { type: 'balance', label: '余额', value: '¥128.47' },
            { type: 'kv', label: '充值', value: '¥118.00', group: 'account' },
            { type: 'kv', label: '赠送', value: '¥10.47', group: 'account' },
            { type: 'kv', label: '近7日消费', value: '¥5.67', group: 'usage7d' },
            { type: 'bars', label: '近7日消费', value: '¥5.67', series: [0.4, 1.2, 0.6, 0.9, 0.3, 1.5, 0.77], seriesLabels: ['8/1', '8/2', '8/3', '8/4', '8/5', '8/6', '8/7'], group: 'usage7d' },
            { type: 'hbar', label: '近7日缓存命中率', value: '80.9%', series: [85.2, 78.4, 92.1, 80.9, 88.6, 76.3, 82.7], seriesLabels: ['8/1', '8/2', '8/3', '8/4', '8/5', '8/6', '8/7'], group: 'usage7d' },
            { type: 'hbar', label: '当日模型用量', value: '1.5M', series: [1020000, 453000, 28000], seriesLabels: ['Flash', 'Vision', 'Pro'] },
            { type: 'ringshare', label: '当日用量占比', value: '1.5M', series: [1020000, 453000, 28000], seriesLabels: ['Flash', 'Vision', 'Pro'], colors: ['#4D6BFE', '#22D3EE', '#FBBF24'] },
            { type: 'ringseg', label: '当日占比·单环', value: '1.5M', series: [1020000, 453000, 28000], seriesLabels: ['Flash', 'Vision', 'Pro'], colors: ['#4D6BFE', '#22D3EE', '#FBBF24'] },
          ],
        },
        {
          id: 'openrouter',
          name: 'OpenRouter',
          accent: '#F59E0B',
          status: 'ok',
          statusText: '已连接',
          balance: { total: 7.5, topUp: 10, granted: null, currency: 'USD', checkedAt: now },
          widgets: [
            { type: 'balance', label: '余额', value: '$7.50' },
            { type: 'kv', label: '充值额度', value: '$10.00' },
            { type: 'bar', label: '已用额度', value: '$2.50', percent: 25 },
            { type: 'ring', label: '额度使用率', value: '25.0%', percent: 25 },
            { type: 'stack', label: '额度构成', value: '已用 25%', series: [2.5, 7.5], hint: '已用 $2.50\n剩余 $7.50' },
          ],
        },
      ],
    },
    {
      // 场景 2:缓存数据(余额较旧)
      v: 2,
      generatedAt: now,
      freshness: 'cached',
      providers: [
        {
          id: 'deepseek',
          name: 'DeepSeek',
          accent: '#4D6BFE',
          status: 'stale',
          statusText: '缓存',
          balance: { total: 128.47, topUp: 118, granted: 10.47, currency: 'CNY', checkedAt: now - 900 },
          widgets: [
            { type: 'balance', value: '¥128.47' },
            { type: 'kv', label: '充值', value: '¥118.00' },
          ],
        },
        {
          id: 'zhipu',
          name: '智谱 GLM',
          accent: '#0EA5E9',
          status: 'error',
          statusText: '获取失败',
          balance: null,
          widgets: [{ type: 'note', value: '获取失败\n401 未授权:API Key 无效' }],
        },
      ],
    },
    {
      // 场景 3:空态
      v: 2,
      generatedAt: now,
      freshness: 'unavailable',
      providers: [],
    },
  ]
  return validateSnapshot(list[scene - 1] || list[0])
}

export function startSync(handlerSet, opts) {
  handlers = handlerSet || {}
  mockScene = (opts && opts.mockScene) || 1
  requestedClose = false
  let pushed = 0
  const push = () => {
    if (requestedClose) return
    if (handlers.onSnapshot) handlers.onSnapshot(mockSnapshot(mockScene))
    pushed++
    if (mockScene === 1) {
      timer = setTimeout(push, 15000)
    } else if (pushed < 2) {
      timer = setTimeout(push, 8000)
    }
  }
  timer = setTimeout(push, 500)
}

export function stopSync() {
  requestedClose = true
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  handlers = null
}
