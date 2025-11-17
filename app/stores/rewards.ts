import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RewardTemplate } from '~/types'
import type { RewardSettings, RewardMilestoneMessage } from '~/types/class'
import {
    REWARD_DEFAULTS,
    REWARD_CONSTRAINTS,
    REWARD_MILESTONE_MESSAGE_MAX_LENGTH,
    buildDefaultMilestoneMessages,
    validateRewardSetting,
} from '~/constants/rewards'

const REWARDS_STORAGE_KEY = 'reward-templates-data'

const createDefaultTemplate = (): RewardTemplate => ({
    id: `template_${Date.now()}`,
    name: '預設獎勵規則',
    isDefault: true,
    settings: {
        enabled: true,
        pointsPerStar: REWARD_DEFAULTS.pointsPerStar,
        starsToInvincible: REWARD_DEFAULTS.starsToInvincible,
        invincibleDurationSeconds: REWARD_DEFAULTS.invincibleDurationSeconds,
        invinciblePointsPerClick: REWARD_DEFAULTS.invinciblePointsPerClick,
        milestoneMessages: [...REWARD_DEFAULTS.milestoneMessages],
    },
})

/**
 * 驗證並規範化獎勵設置
 * 確保所有值都在允許的範圍內
 */
function sanitizeMilestoneMessages(
    messages: RewardSettings['milestoneMessages'],
    starsToInvincible: number,
): RewardMilestoneMessage[] {
    if (!Array.isArray(messages)) {
        return buildDefaultMilestoneMessages(starsToInvincible)
    }

    const maxThreshold = Math.max(1, Math.floor(starsToInvincible))

    const sanitized = messages
        .map((item) => {
            const threshold = Math.floor(Number(item?.threshold) || 0)
            const message =
                typeof item?.message === 'string'
                    ? item.message.trim().slice(0, REWARD_MILESTONE_MESSAGE_MAX_LENGTH)
                    : ''
            return { threshold, message }
        })
        .filter(
            (item): item is RewardMilestoneMessage =>
                item.threshold >= 1 && item.threshold <= maxThreshold && item.message.length > 0,
        )
        .sort((a, b) => a.threshold - b.threshold)

    if (sanitized.length === 0) {
        return buildDefaultMilestoneMessages(maxThreshold)
    }

    const deduped: RewardMilestoneMessage[] = []
    const thresholds = new Map<number, number>()

    sanitized.forEach((item) => {
        if (thresholds.has(item.threshold)) {
            const index = thresholds.get(item.threshold)!
            deduped[index] = item
        } else {
            thresholds.set(item.threshold, deduped.length)
            deduped.push(item)
        }
    })

    // 確保最後一筆是無敵門檻的訊息
    if (!thresholds.has(maxThreshold)) {
        deduped.push({
            threshold: maxThreshold,
            message: '衝刺無敵星星！'.slice(0, REWARD_MILESTONE_MESSAGE_MAX_LENGTH),
        })
    }

    return deduped
}

function normalizeRewardSettings(settings: Partial<RewardSettings>): RewardSettings {
    const enabled = settings.enabled ?? true
    const pointsPerStar = Math.max(
        REWARD_CONSTRAINTS.pointsPerStar.min,
        Math.min(
            settings.pointsPerStar ?? REWARD_DEFAULTS.pointsPerStar,
            REWARD_CONSTRAINTS.pointsPerStar.max,
        ),
    )
    const starsToInvincible = Math.max(
        REWARD_CONSTRAINTS.starsToInvincible.min,
        Math.min(
            settings.starsToInvincible ?? REWARD_DEFAULTS.starsToInvincible,
            REWARD_CONSTRAINTS.starsToInvincible.max,
        ),
    )
    const invincibleDurationSeconds = Math.max(
        REWARD_CONSTRAINTS.invincibleDurationSeconds.min,
        Math.min(
            settings.invincibleDurationSeconds ?? REWARD_DEFAULTS.invincibleDurationSeconds,
            REWARD_CONSTRAINTS.invincibleDurationSeconds.max,
        ),
    )
    const invinciblePointsPerClick = Math.max(
        REWARD_CONSTRAINTS.invinciblePointsPerClick.min,
        Math.min(
            settings.invinciblePointsPerClick ?? REWARD_DEFAULTS.invinciblePointsPerClick,
            REWARD_CONSTRAINTS.invinciblePointsPerClick.max,
        ),
    )

    const milestoneMessages = sanitizeMilestoneMessages(
        settings.milestoneMessages,
        starsToInvincible,
    )

    return {
        enabled,
        pointsPerStar,
        starsToInvincible,
        invincibleDurationSeconds,
        invinciblePointsPerClick,
        milestoneMessages,
    }
}

export const useRewardsStore = defineStore('rewards', () => {
    const rewardTemplates = ref<RewardTemplate[]>([])
    const isLoaded = ref(false)

    const defaultTemplate = computed(
        () => rewardTemplates.value.find((t) => t.isDefault) || rewardTemplates.value[0],
    )

    function saveToStorage() {
        if (!process.client) return
        try {
            localStorage.setItem(REWARDS_STORAGE_KEY, JSON.stringify(rewardTemplates.value))
        } catch (error) {
            console.error('儲存獎勵範本失敗:', error)
        }
    }

    function loadFromStorage() {
        if (!process.client) return
        try {
            const saved = localStorage.getItem(REWARDS_STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                // 規範化所有已載入的設置
                rewardTemplates.value = parsed.map((t: RewardTemplate) => ({
                    ...t,
                    settings: normalizeRewardSettings(t.settings),
                }))
            } else {
                rewardTemplates.value = [createDefaultTemplate()]
            }

            if (!rewardTemplates.value.some((t) => t.isDefault)) {
                if (rewardTemplates.value.length > 0) {
                    rewardTemplates.value[0].isDefault = true
                } else {
                    rewardTemplates.value.push(createDefaultTemplate())
                }
            }
        } catch (error) {
            console.error('載入獎勵範本失敗:', error)
            rewardTemplates.value = [createDefaultTemplate()]
        } finally {
            isLoaded.value = true
            saveToStorage()
        }
    }

    function addTemplate(name: string, settings: Partial<RewardSettings>): RewardTemplate {
        // 驗證名稱
        const trimmedName = name.trim()
        if (!trimmedName) {
            throw new Error('範本名稱不能為空')
        }

        // 規範化設置
        const normalizedSettings = normalizeRewardSettings(settings)

        const newTemplate: RewardTemplate = {
            id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: trimmedName,
            settings: normalizedSettings,
        }
        rewardTemplates.value.push(newTemplate)
        saveToStorage()
        return newTemplate
    }

    function updateTemplate(templateId: string, updates: Partial<RewardTemplate>) {
        const index = rewardTemplates.value.findIndex((t) => t.id === templateId)
        if (index === -1) {
            throw new Error(`找不到 ID 為 ${templateId} 的範本`)
        }

        const template = rewardTemplates.value[index]

        // 驗證名稱
        if (updates.name !== undefined) {
            const trimmedName = updates.name.trim()
            if (!trimmedName) {
                throw new Error('範本名稱不能為空')
            }
            template.name = trimmedName
        }

        // 規範化設置
        if (updates.settings) {
            template.settings = normalizeRewardSettings(updates.settings)
        }

        if (updates.isDefault !== undefined) {
            template.isDefault = updates.isDefault
        }

        saveToStorage()
    }

    function deleteTemplate(templateId: string) {
        const index = rewardTemplates.value.findIndex((t) => t.id === templateId)
        if (index > -1) {
            const wasDefault = rewardTemplates.value[index].isDefault
            rewardTemplates.value.splice(index, 1)
            if (wasDefault && rewardTemplates.value.length > 0) {
                rewardTemplates.value[0].isDefault = true
            }
            if (rewardTemplates.value.length === 0) {
                rewardTemplates.value.push(createDefaultTemplate())
            }
            saveToStorage()
            return true
        }
        return false
    }

    function setDefaultTemplate(templateId: string) {
        const template = rewardTemplates.value.find((t) => t.id === templateId)
        if (!template) {
            throw new Error(`找不到 ID 為 ${templateId} 的範本`)
        }

        rewardTemplates.value.forEach((t) => {
            t.isDefault = t.id === templateId
        })
        saveToStorage()
    }

    function getTemplateById(templateId: string | null) {
        if (!templateId) return null
        return rewardTemplates.value.find((t) => t.id === templateId) || null
    }

    function resetToDefault() {
        rewardTemplates.value = [createDefaultTemplate()]
        saveToStorage()
    }

    function moveTemplate(fromIndex: number, toIndex: number) {
        // 驗證索引
        if (fromIndex < 0 || fromIndex >= rewardTemplates.value.length) {
            return false
        }
        if (toIndex < 0 || toIndex >= rewardTemplates.value.length) {
            return false
        }

        // 如果索引相同，無需操作
        if (fromIndex === toIndex) {
            return false
        }

        // 執行移動
        const [removed] = rewardTemplates.value.splice(fromIndex, 1)
        rewardTemplates.value.splice(toIndex, 0, removed)

        saveToStorage()
        return true
    }

    return {
        rewardTemplates,
        isLoaded,
        defaultTemplate,
        loadFromStorage,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        setDefaultTemplate,
        getTemplateById,
        resetToDefault,
        moveTemplate,
        // 匯出驗證函數供組件使用
        normalizeRewardSettings,
    }
})
