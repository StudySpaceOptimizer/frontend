import { translate } from "@/i18n"
import { isJsonString } from "@/utils"

export function toLocalDateTime(time: string): Date {
  // 將 ISO 字符串轉為 UTC Date 對象
  const timeUTC = new Date(time)

  // 計算 UTC+8 的時間
  const offset = 8 // UTC+8
  const timeUTC8 = new Date(timeUTC.getTime() + offset * 3600 * 1000)

  return timeUTC8
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(':')
  return { hours: parseInt(parts[0], 10), minutes: parseInt(parts[1], 10) }
}

export function errorHandler(errorMessage: string): string {
  if (isJsonString(errorMessage)) {
    const { code, data = [] } = JSON.parse(errorMessage);
    return translate(code, ...data);
  }
  return translate(errorMessage) || translate('default');
}
