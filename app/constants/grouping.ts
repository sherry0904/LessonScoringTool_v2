/**
 * 分組機制常量與配置
 *
 * 此文件集中管理分組系統的常量、預設值與驗證規則。
 *
 * @file app/constants/grouping.ts
 */

/**
 * 分組的基本配置
 */
export const GROUP_CONFIG = {
    // 組別相關
    minGroups: 2,
    maxGroups: 10,
    defaultGroupCount: 4,

    // 顏色配置 (Tailwind + 適合教學場景)
    // 選擇高度飽和且易於區分的顏色
    defaultColors: [
        '#3b82f6', // blue-500      - 藍色
        '#ef4444', // red-500       - 紅色
        '#10b981', // emerald-500   - 翠綠色
        '#f59e0b', // amber-500     - 琥珀色
        '#8b5cf6', // violet-500    - 紫色
        '#ec4899', // pink-500      - 粉紅色
        '#06b6d4', // cyan-500      - 青色
        '#84cc16', // lime-500      - 萊姆色
    ],
} as const

/**
 * 分組設置的驗證規則
 */
export const GROUPING_CONSTRAINTS = {
    groupCount: {
        min: GROUP_CONFIG.minGroups,
        max: GROUP_CONFIG.maxGroups,
        errorMessage: `組數必須在 ${GROUP_CONFIG.minGroups} 到 ${GROUP_CONFIG.maxGroups} 之間`,
    },
    groupName: {
        minLength: 1,
        maxLength: 50,
        errorMessage: '組名長度必須在 1 到 50 個字元之間',
    },
} as const

/**
 * 分組相關的計時常數
 */
export const GROUPING_TIMING = {
    // 自動存儲分組編輯的延遲
    AUTO_SAVE_DELAY_MS: 500,

    // 拖拽操作時的自動滾動速度
    DRAG_SCROLL_SPEED: 20,

    // 拖拽操作時的自動滾動觸發邊界
    DRAG_SCROLL_THRESHOLD_PX: 80,

    // 分數動畫持續時間
    SCORE_ANIMATION_DURATION_MS: 500,

    // 排行榜轉場動畫持續時間
    LEADERBOARD_TRANSITION_MS: 500,
} as const

/**
 * 分組視圖配置
 */
export const GROUPING_VIEW_CONFIG = {
    // 預設的排行榜顯示數量選項
    leaderboardDisplayOptions: [
        { label: '全部', value: 'all' },
        { label: '前 3 名', value: 3 },
        { label: '前 5 名', value: 5 },
    ],

    // 預設選項
    defaultLeaderboardDisplay: 'all',

    // 是否預設顯示組員清單
    defaultGroupsCollapsed: false,

    // 是否預設顯示非出席學生面板
    defaultUngroupedCollapsed: false,
} as const

/**
 * 用戶友善的標籤和說明
 */
export const GROUPING_LABELS = {
    groupCount: {
        label: '組數',
        description: '建立多少個小組',
    },
    groupName: {
        label: '組名',
        description: '組別名稱（例如：紅組、A組）',
    },
    studentCount: {
        label: '人數',
        description: '組內學生人數',
    },
} as const

/**
 * 分組模式相關的常數
 */
export const GROUPING_MODE = {
    // 模式枚舉
    EDIT: 'edit',
    VIEW: 'view',
    ACTIVE: 'active',
} as const

/**
 * 驗證分組名稱
 * @param name - 要驗證的組名
 * @returns 驗證結果
 */
export function validateGroupName(name: string): { isValid: boolean; error?: string } {
    const constraint = GROUPING_CONSTRAINTS.groupName

    if (!name || name.trim().length === 0) {
        return { isValid: false, error: '組名不能為空' }
    }

    if (name.length < constraint.minLength || name.length > constraint.maxLength) {
        return { isValid: false, error: constraint.errorMessage }
    }

    return { isValid: true }
}

/**
 * 驗證組數
 * @param count - 要驗證的組數
 * @returns 驗證結果
 */
export function validateGroupCount(count: number): { isValid: boolean; error?: string } {
    const constraint = GROUPING_CONSTRAINTS.groupCount

    if (!Number.isFinite(count)) {
        return { isValid: false, error: '組數必須是有效的數字' }
    }

    const intCount = Math.floor(count)
    if (intCount < constraint.min || intCount > constraint.max) {
        return { isValid: false, error: constraint.errorMessage }
    }

    return { isValid: true }
}

/**
 * 獲取指定索引對應的顏色
 * @param index - 顏色索引
 * @returns 十六進制顏色代碼
 */
export function getGroupColor(index: number): string {
    return GROUP_CONFIG.defaultColors[index % GROUP_CONFIG.defaultColors.length]
}

/**
 * 獲取所有預定義的組別顏色
 * @returns 顏色陣列
 */
export function getAllGroupColors(): string[] {
    return [...GROUP_CONFIG.defaultColors]
}

/**
 * 標準化組數至有效範圍
 * @param count - 原始組數
 * @returns 標準化後的組數
 */
export function normalizeGroupCount(count: number | string | null | undefined): number {
    const n = Math.floor(Number(count))
    if (!Number.isFinite(n)) return GROUP_CONFIG.defaultGroupCount
    return Math.max(GROUP_CONFIG.minGroups, Math.min(n, GROUP_CONFIG.maxGroups))
}
