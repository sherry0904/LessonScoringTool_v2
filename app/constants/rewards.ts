import type { RewardMilestoneMessage } from '~/types/class'

export const REWARD_MILESTONE_MESSAGE_MAX_LENGTH = 10

/**
 * 獎勵機制常量與配置
 *
 * 此文件集中管理所有獎勵系統的常量、預設值與驗證規則。
 * 修改此處會自動同步到整個應用。
 *
 * @file app/constants/rewards.ts
 */

/**
 * 獎勵機制預設設置
 * 用於建立新範本或重置配置時使用
 */
export const REWARD_DEFAULTS = {
    // 基本設置
    pointsPerStar: 20, // 多少分數可獲得一顆星星
    starsToInvincible: 5, // 多少顆星星可觸發無敵模式
    invincibleDurationSeconds: 600, // 無敵模式持續時間（秒）
    invinciblePointsPerClick: 2, // 無敵模式下每次加分的點數
    milestoneMessages: buildDefaultMilestoneMessages(3),
} as const

/**
 * 獎勵設置的驗證規則與邊界值
 * 用於表單驗證和數據邊界檢查
 */
export const REWARD_CONSTRAINTS = {
    pointsPerStar: {
        min: 1,
        max: 100,
        errorMessage: '分數門檻必須在 1 到 100 之間',
    },
    starsToInvincible: {
        min: 1,
        max: 10,
        errorMessage: '星星門檻必須在 1 到 10 之間',
    },
    invincibleDurationSeconds: {
        min: 1,
        max: 3600,
        errorMessage: '無敵時間必須在 1 到 3600 秒之間',
    },
    invinciblePointsPerClick: {
        min: 1,
        max: 10,
        errorMessage: '無敵加分值必須在 1 到 10 之間',
    },
} as const

/**
 * 使用者友善的獎勵設置標籤和說明
 * 用於 UI 中顯示和幫助文字
 */
export const REWARD_LABELS = {
    pointsPerStar: {
        label: '得分門檻',
        description: '學生團隊每獲得多少分數時，可以獲得一顆星星',
        unit: '分',
    },
    starsToInvincible: {
        label: '星星門檻',
        description: '當星星數達到多少時，觸發無敵星星模式',
        unit: '顆',
    },
    invincibleDurationSeconds: {
        label: '無敵持續時間',
        description: '無敵模式能維持多長時間',
        unit: '秒',
    },
    invinciblePointsPerClick: {
        label: '無敵加分值',
        description: '在無敵模式下，每次加分時增加多少分數',
        unit: '分',
    },
} as const

/**
 * 獎勵系統的預設模板集合
 * 教師可以快速套用預設的獎勵規則
 */
export const PRESET_REWARD_TEMPLATES = {
    basic: {
        name: '基礎模式',
        description: '適合日常小組活動',
        settings: {
            enabled: true,
            pointsPerStar: 10,
            starsToInvincible: 3,
            invincibleDurationSeconds: 600,
            invinciblePointsPerClick: 2,
            milestoneMessages: buildDefaultMilestoneMessages(3),
        },
    },
    intensive: {
        name: '高強度競賽模式',
        description: '適合重要競賽或頻繁互動',
        settings: {
            enabled: true,
            pointsPerStar: 5,
            starsToInvincible: 4,
            invincibleDurationSeconds: 900,
            invinciblePointsPerClick: 3,
            milestoneMessages: buildDefaultMilestoneMessages(4),
        },
    },
    gentle: {
        name: '溫和模式',
        description: '適合低年級或初學者',
        settings: {
            enabled: true,
            pointsPerStar: 15,
            starsToInvincible: 2,
            invincibleDurationSeconds: 480,
            invinciblePointsPerClick: 1,
            milestoneMessages: buildDefaultMilestoneMessages(2),
        },
    },
    disabled: {
        name: '停用',
        description: '不啟用任何獎勵機制',
        settings: {
            enabled: false,
            pointsPerStar: 10,
            starsToInvincible: 3,
            invincibleDurationSeconds: 600,
            invinciblePointsPerClick: 2,
            milestoneMessages: buildDefaultMilestoneMessages(3),
        },
    },
} as const

/**
 * 獎勵系統的計時常數
 * 用於精確控制系統的時間行為
 */
export const REWARD_TIMING = {
    // 無敵狀態檢查間隔（毫秒）
    // 每隔多久檢查一次是否有組別的無敵時間已到期
    INVINCIBLE_CHECK_INTERVAL_MS: 1000,

    // 倒數計時器更新頻率（毫秒）
    TIMER_UPDATE_INTERVAL_MS: 100,

    // 自動存儲間隔（毫秒）
    AUTO_SAVE_INTERVAL_MS: 2000,

    // 無敵狀態變化後的動畫延遲（毫秒）
    INVINCIBLE_ANIMATION_DELAY_MS: 300,
} as const

/**
 * 驗證獎勵設置的工具函數
 * @param key - 要驗證的設置鍵
 * @param value - 要驗證的值
 * @returns 驗證結果 { isValid: boolean, error?: string }
 */
export function validateRewardSetting(
    key: keyof typeof REWARD_CONSTRAINTS,
    value: unknown,
): { isValid: boolean; error?: string } {
    const constraint = REWARD_CONSTRAINTS[key]

    if (typeof value !== 'number') {
        return {
            isValid: false,
            error: '值必須是數字',
        }
    }

    if (value < constraint.min || value > constraint.max) {
        return {
            isValid: false,
            error: constraint.errorMessage,
        }
    }

    return { isValid: true }
}

/**
 * 將獲得的星星轉換為無敵模式觸發次數
 * @param totalStars - 總星星數
 * @param starsToInvincible - 觸發無敵所需星星數
 * @returns 能觸發的無敵次數
 */
export function calculateInvincibleCount(totalStars: number, starsToInvincible: number): number {
    return Math.floor(totalStars / starsToInvincible)
}

/**
 * 將時間戳轉換為 MM:SS 格式
 * @param milliseconds - 毫秒數
 * @returns 格式化後的時間字符串 (MM:SS)
 */
export function formatInvincibleTimer(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

/**
 * 依據星星門檻建立預設的里程碑訊息
 * @param starsToInvincible 要進入無敵模式的星星數
 */
export function buildDefaultMilestoneMessages(starsToInvincible: number): RewardMilestoneMessage[] {
    const safeThreshold = Math.max(1, Math.floor(starsToInvincible))

    // 確保沒有里程碑被設在無敵門檻上 (safeThreshold)
    const candidates: Array<[number, string]> = [
        [Math.max(1, Math.ceil(safeThreshold * 0.35)), '表現很不錯！'], // ~35%
        [Math.max(1, Math.ceil(safeThreshold * 0.6)), '拼了拼了！'], // ~60%
        [Math.max(1, safeThreshold - 1), '只差一步！'], // threshold - 1
    ]

    const seen = new Set<number>()
    const result: RewardMilestoneMessage[] = []

    for (const [threshold, message] of candidates) {
        // 過濾掉無效或超出範圍的里程碑（包括無敵門檻本身）
        if (threshold < 1 || threshold >= safeThreshold) continue
        if (seen.has(threshold)) continue
        seen.add(threshold)
        result.push({
            threshold,
            message: message.slice(0, REWARD_MILESTONE_MESSAGE_MAX_LENGTH),
        })
    }

    return result
}

/**
 * 計算剩餘的星星數（已消耗部分）
 * @param totalStars - 總星星數
 * @param starsToInvincible - 觸發無敵所需星星數
 * @returns 剩餘的、未被消耗的星星數
 */
export function calculateRemainingStars(totalStars: number, starsToInvincible: number): number {
    return totalStars % starsToInvincible
}
