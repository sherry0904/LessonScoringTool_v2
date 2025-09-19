// app/types/homework.ts

/**
 * 全域作業範本的資料結構
 */
export interface GlobalHomework {
  id: string; // 唯一 ID，可使用 nanoid 或 uuid
  name: string; // 作業名稱
  createdAt: string; // ISO 8601 格式的日期字串
  notes?: string; // 備註
  hiddenFromClassIds: string[]; // 儲存要隱藏此作業的班級 ID 列表
  isArchived: boolean; // 是否已封存
}
