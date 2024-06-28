export default {
  system: '預約系統',
  navbar: {
    signIn: '登入',
    signOut: '登出',
    profile: '個人資料',
    reservation: '預約紀錄',
    title: '嗨，{name}！'
  },
  signInModal: {
    title: '登入',
    emailLabel: '信箱',
    emailPlaceholder: '請輸入信箱',
    passwordLabel: '密碼',
    passwordPlaceholder: '請輸入密碼',
    signUp: '校外人士註冊',
    signIn: '登入'
  },
  signUpModal: {
    title: '校外人士註冊',
    name: '姓名',
    telphone: '手機',
    idCard: '身分證字號',
    email: '信箱',
    signUp: '註冊',
    namePlaceholder: '請輸入姓名',
    telphonePlaceholder: '請輸入手機號碼',
    idCardPlaceholder: '請輸入身分證字號',
    emailPlaceholder: '請輸入信箱'
  },
  seat: {
    StairDoor: '樓梯門',
    MainDoor: '大門',
    MenToilet: '男廁',
    Elevator: '電梯'
  },
  profileView: {
    personalData: '個人資料',
    reservationHistory: '預約紀錄',
    date: '日期',
    beginTime: '開始時間',
    endTime: '結束時間',
    seatId: '座位編號',
    actions: '操作',
    enterName: '請輸入姓名',
    nameMaxLength: '姓名最多 {max} 個字元',
    email: '信箱',
    emailTooltip: '若需要修改電子信箱，請告知管理員',
    name: '姓名',
    cancelChanges: '取消變更',
    saveChanges: '儲存變更',

    cancel: '取消預約',
    cancelSuccess: '取消預約成功',
    cancelConfirmation: '確定要取消座位 {seatID} 於 {date} {beginTime} 至 {endTime} 的預約嗎？',

    terminate: '提前離開',
    terminateSuccess: '提前離開成功',
    terminateConfirmation: '確定要提前離開嗎？',
  },
  bookingModel: {
    selectReservationTime: '請選擇預約時間',
    reserveSuccess: '預約成功',

    reserveSeat: '預約座位 {seatName}',
    reserveDate: '預約日期',
    reserveTime: '預約時間',
    notSelectedTime: '未選擇時間',
    reserve: '預約',

    reserved: '已預約',
    notSelectable: '不可選擇',
    cancelSelection: '取消選擇',
    select: '選擇',
  },
  warning: '警告',
  confirm: '確認',
  cancel: '取消',
  available: '可預約',
  booked: '已預約',
  partiallyBooked: '部分時段已預約',
  unavailable: '該座位不可預約',

  filter: '開始篩選',

  U0001: '權限不足',
  D0001: '資料已存在',
  R0001: '尚未報到',
  R0002: '開始和結束時間必須在同一天',
  R0003: '結束時間必須晚於開始時間',
  R0004: '預約開始時間必須大於當前時間',
  R0005: '所選座位不可用',
  R0006: '預約時間與現有預約重疊',
  R0007: '用戶在預約當天有未完成的預約',
  R0008: '只能刪除尚未開始的預約',
  RS0001: '預約時間必須在工作日的開放時間',
  RS0002: '預約時間必須在周末的開放時間內',
  RS0003: '預約時間必須以 % 分鐘為單位',
  RS0004: '預約時長必須少於 % 小時',
  RS0005: '學生只能提前 % 天進行預約',
  RS0006: '校外人士只能提前 % 天進行預約',
  RS0007: '預約時間與關閉時段重疊',
  P0001: '參數格式錯誤',
  '42501': '權限不足',
  '23505': '資料已存在',
  '23502': '部分必填欄位缺失',
  '23503': '所引用的外部資料不存在',
  '23514': '資料不符合要求的條件',
  '22P02': '資料格式錯誤',
  PGRST116: '權限不足',
  bad_json: 'JSON格式錯誤',
  bad_jwt: 'JWT token無效',
  email_exists: '電子郵件地址已存在',
  email_not_confirmed: '電子郵件地址未確認',
  weak_password: '密碼強度不足',
  user_not_found: '用戶不存在',
  user_already_exists: '用戶已存在',
  signup_disabled: '註冊已禁用',
  session_not_found: '會話不存在',
  no_authorization: '需要授權',
  unexpected_failure: '發生意外錯誤',
  over_email_send_rate_limit: '請求過多，請稍後再試',
  over_request_rate_limit: '請求過多，請稍後再試',
  over_sms_send_rate_limit: '請求過多，請稍後再試',
  captcha_failed: '驗證碼驗證失敗',
  reauthentication_needed: '需要重新驗證身份'
}
