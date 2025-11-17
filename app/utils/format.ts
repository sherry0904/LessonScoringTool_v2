/**
 * 通用格式化工具函數集合
 * 用於日期、時間的本地化格式化
 */

/**
 * 格式化日期時間為本地化字符串
 * 適用於評分記錄、詳情報告等需要顯示完整時間的地方
 *
 * @param date - 日期對象
 * @returns 格式化後的日期時間字符串
 * @example formatDateTime(new Date()) → "11月 14日 14:30"
 */
export function formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * 格式化日期為本地化字符串
 * 適用於日期選擇、班級創建日期等只需要顯示日期的地方
 *
 * @param date - 日期對象
 * @returns 格式化後的日期字符串
 * @example formatDate(new Date()) → "11月 14日"
 */
export function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
    })
}
