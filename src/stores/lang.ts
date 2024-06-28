import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

import type { LangEnum } from '@/types'

export const useLangStore = defineStore('lang', () => {
  const { locale } = useI18n()
  const lang = ref<LangEnum>('zh-tw')

  function setLang(_lang: LangEnum): void {
    lang.value = _lang
    locale.value = _lang
    sessionStorage.setItem("lang", _lang)
  }

  return {
    lang,
    setLang
  }
}, {
  persist: true
})