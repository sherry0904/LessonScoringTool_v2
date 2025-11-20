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
import { useClassesStore } from '~/stores/classes'

const REWARDS_STORAGE_KEY = 'reward-templates-data'

const createDefaultTemplate = (): RewardTemplate => ({
    id: `template_${Date.now()}`,
    name: '預設獎勵規則（各組獨立）',
    isDefault: false, // 不再自動設為預設
    settings: {
        enabled: true,
        mode: 'group-based',
        pointsPerStar: REWARD_DEFAULTS.pointsPerStar,
        starsToInvincible: REWARD_DEFAULTS.starsToInvincible,
        invincibleDurationSeconds: REWARD_DEFAULTS.invincibleDurationSeconds,
        invinciblePointsPerClick: REWARD_DEFAULTS.invinciblePointsPerClick,
        milestoneMessages: [...REWARD_DEFAULTS.milestoneMessages],
    },
})

const createClassTotalDefaultTemplate = (): RewardTemplate => ({
    id: `template_class_total_${Date.now()}`,
    name: '預設獎勵規則（全班協作）',
    isDefault: false, // 不再自動設為預設
    settings: {
        enabled: true,
        mode: 'class-total',
        classTotalTargetPoints: 200,
        invincibleDurationSeconds: 600, // 10 分鐘
        invinciblePointsPerClick: 2,
        milestoneMessages: [],
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
    const mode = settings.mode ?? REWARD_DEFAULTS.mode

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

    // 規範化全班總分模式設定
    const resolvedClassTotalTargetRaw =
        settings.classTotalTargetPoints ??
        settings.classTotalMode?.pointsPerInvincible ??
        REWARD_DEFAULTS.classTotalMode.pointsPerInvincible

    const sanitizedClassTotalTarget = Math.max(
        REWARD_CONSTRAINTS.classTotalPointsPerInvincible.min,
        Math.min(resolvedClassTotalTargetRaw, REWARD_CONSTRAINTS.classTotalPointsPerInvincible.max),
    )

    const resolvedClassTotalDurationRaw =
        settings.classTotalMode?.invincibleDurationSeconds ??
        (settings.mode === 'class-total' ? invincibleDurationSeconds : undefined) ??
        REWARD_DEFAULTS.classTotalMode.invincibleDurationSeconds

    const sanitizedClassTotalDuration = Math.max(
        REWARD_CONSTRAINTS.invincibleDurationSeconds.min,
        Math.min(resolvedClassTotalDurationRaw, REWARD_CONSTRAINTS.invincibleDurationSeconds.max),
    )

    const resolvedClassTotalPointsRaw =
        settings.classTotalMode?.invinciblePointsPerClick ??
        (settings.mode === 'class-total' ? invinciblePointsPerClick : undefined) ??
        REWARD_DEFAULTS.classTotalMode.invinciblePointsPerClick

    const sanitizedClassTotalPointsPerClick = Math.max(
        REWARD_CONSTRAINTS.invinciblePointsPerClick.min,
        Math.min(resolvedClassTotalPointsRaw, REWARD_CONSTRAINTS.invinciblePointsPerClick.max),
    )

    const classTotalMode = {
        pointsPerInvincible: sanitizedClassTotalTarget,
        invincibleDurationSeconds: sanitizedClassTotalDuration,
        invinciblePointsPerClick: sanitizedClassTotalPointsPerClick,
    }

    // 規範化全班協作模式的目標分數
    const classTotalTargetPoints = sanitizedClassTotalTarget

    return {
        enabled,
        mode,
        pointsPerStar,
        starsToInvincible,
        invincibleDurationSeconds,
        invinciblePointsPerClick,
        milestoneMessages,
        classTotalMode,
        classTotalTargetPoints,
    }
}

export const useRewardsStore = defineStore('rewards', () => {
    const rewardTemplates = ref<RewardTemplate[]>([])
    const isLoaded = ref(false)

    // defaultTemplate 保留但僅用於向後兼容，不建議使用
    const defaultTemplate = computed(() => rewardTemplates.value[0] || null)

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
                // 初始化時創建兩個預設範本（各組獨立 + 全班協作）
                rewardTemplates.value = [createDefaultTemplate(), createClassTotalDefaultTemplate()]
            }

            // 移除自動設定預設範本的邏輯
            // 不再需要 isDefault 欄位
        } catch (error) {
            console.error('載入獎勵範本失敗:', error)
            rewardTemplates.value = [createDefaultTemplate(), createClassTotalDefaultTemplate()]
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

        // 當範本設定改變時，重新應用到所有正在使用該範本的班級
        if (updates.settings) {
            const classesStore = useClassesStore()
            const affectedClasses = classesStore.classes.filter(
                (c) =>
                    c.rewardSettingsMode === 'template' && c.appliedRewardTemplateId === templateId,
            )

            for (const classData of affectedClasses) {
                classesStore.applyTemplateToClass(classData.id, templateId)
            }
        }
    }

    function deleteTemplate(templateId: string) {
        const index = rewardTemplates.value.findIndex((t) => t.id === templateId)
        if (index > -1) {
            rewardTemplates.value.splice(index, 1)
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
        rewardTemplates.value = [createDefaultTemplate(), createClassTotalDefaultTemplate()]
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


    function moveTemplateWithinMode(
        mode: RewardSettings['mode'],
        templateId: string,
        toIndex: number,
    ) {
        const templatesInMode = rewardTemplates.value.filter((t) => t.settings.mode === mode)
        const fromModeIndex = templatesInMode.findIndex((t) => t.id === templateId)
        if (fromModeIndex === -1) {
            return false
        }

        const [removed] = templatesInMode.splice(fromModeIndex, 1)
        const safeInsertionIndex = Math.max(0, Math.min(toIndex, templatesInMode.length))
        templatesInMode.splice(safeInsertionIndex, 0, removed)

        const reordered: RewardTemplate[] = []
        let modePointer = 0

        for (const template of rewardTemplates.value) {
            if (template.settings.mode === mode) {
                reordered.push(templatesInMode[modePointer++])
            } else {
                reordered.push(template)
            }
        }

        rewardTemplates.value = reordered
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
        moveTemplateWithinMode,
        // 匯出驗證函數供組件使用
        normalizeRewardSettings,
    }
})
