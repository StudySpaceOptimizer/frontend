export function toLocalDateTime(time: string): Date {
  // 將 ISO 字符串轉為 UTC Date 對象
  const timeUTC = new Date(time)

  // 計算 UTC+8 的時間
  const offset = 8 // UTC+8
  const timeUTC8 = new Date(timeUTC.getTime() + offset * 3600 * 1000)

  return timeUTC8
}
