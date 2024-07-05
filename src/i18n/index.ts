import { createI18n } from 'vue-i18n'

import en from './lang/en'
import zhTw from './lang/zh-tw'

const i18n = createI18n({
  locale: sessionStorage.getItem('lang') || 'zh-tw',
  allowComposition: true,
  legacy: false,
  messages: {
    en,
    'zh-tw': zhTw
  }
})

export function translate(key: string, values?: any): string {
  return i18n.global.t(key, values) as string
}

export default i18n