/** 快照本地缓存:Files 分区文件
 * storage 在真机写入不持久,文件更可靠 */

import file from '@system.file'
import { validateSnapshot } from './snapshot'

const CACHE_URI = 'internal://files/snapshot_cache_v2.json'

export function loadCachedSnapshot(cb) {
  file.readText({
    uri: CACHE_URI,
    success: data => {
      if (!data || !data.text) {
        cb(null)
        return
      }
      try {
        cb(validateSnapshot(JSON.parse(data.text)))
      } catch (e) {
        cb(null)
      }
    },
    fail: () => cb(null),
  })
}

// 快照缓存:写 internal://files (卸载残留假说已排除——W1 no-op 仍崩,真机靠
// 实时互联 + 本地缓存双通道;离开主机后仍可显示最近数据,故保留写入)
export function saveCachedSnapshot(snap) {
  file.writeText({
    uri: CACHE_URI,
    text: JSON.stringify(snap),
    fail: () => console.warn('[cache] save failed'),
  })
}
