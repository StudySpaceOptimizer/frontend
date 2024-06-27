import { createI18n } from 'vue-i18n'

import en from './lang/en'
import zhTw from './lang/zh-tw'

const i18n = createI18n({
  locale: 'zh-tw',
  allowComposition: true,
  legacy: false,
  messages: {
    en,
    'zh-tw': zhTw
  }
})

export default i18n