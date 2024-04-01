export interface Response<T> {
  status: number
  error?: string
  data?: T
}

async function insertIfNotExists(db: any, doc: any) {
  try {
    // 嘗試查詢文檔
    await db.get(doc._id)
    // 如果能夠查詢到文檔，則表示文檔已存在，不執行插入
    console.log('Document already exists')
  } catch (err: unknown) {
    if (err instanceof Error) {
      // 如果查詢過程中出現錯誤，則可能是因為文檔不存在
      if (err.name === 'not_found') {
        // 文檔不存在，執行插入操作
        try {
          const response = await db.put(doc)
          console.log('Document inserted', response)
        } catch (insertError) {
          // 處理插入過程中可能出現的錯誤
          console.error('Error inserting document', insertError)
        }
      } else {
        // 處理其他可能的查詢錯誤
        console.error('Error querying document', err)
      }
    }
  }
}
