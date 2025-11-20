<template>
    <div class="tooltip tooltip-bottom z-50" :data-tip="tooltipText">
        <div class="flex items-center gap-1.5">
            <LucideIcon
                :name="modeIcon"
                class="w-4 h-4 flex-shrink-0"
                :style="{ color: iconColor }"
            />
            <span class="text-sm">{{ displayText }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ClassInfo, RewardSettings } from '~/types'
import { useRewardsStore } from '~/stores/rewards'
import { formatDurationDisplay } from '~/constants/rewards'

interface Props {
    classInfo: ClassInfo
    showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showDetails: false,
})

const rewardsStore = useRewardsStore()

// 取得生效設定
const settings = computed<RewardSettings | null>(() => {
    if (
        props.classInfo.rewardSettingsMode === 'template' &&
        props.classInfo.appliedRewardTemplateId
    ) {
        return (
            rewardsStore.getTemplateById(props.classInfo.appliedRewardTemplateId)?.settings || null
        )
    }
    return null
})

// 顯示文字（範本名稱或狀態）
const displayText = computed(() => {
    if (props.classInfo.rewardSettingsMode === 'disabled') {
        return '已停用'
    }
    if (
        props.classInfo.rewardSettingsMode === 'template' &&
        props.classInfo.appliedRewardTemplateId
    ) {
        const template = rewardsStore.getTemplateById(props.classInfo.appliedRewardTemplateId)
        return template?.name || '範本'
    }
    return '未設定'
})

// 模式 Icon（交換後）
const modeIcon = computed(() => {
    if (props.classInfo.rewardSettingsMode === 'disabled') {
        return 'Ban'
    }
    if (settings.value?.mode === 'class-total') {
        return 'Users' // 全班協作 = 多人協作
    }
    if (settings.value?.mode === 'group-based') {
        return 'Trophy' // 各組獨立 = 各組爭冠軍
    }
    return 'AlertCircle'
})

// Icon 顏色（使用 HSL 色彩）
const iconColor = computed(() => {
    if (props.classInfo.rewardSettingsMode === 'disabled') {
        return 'hsl(0, 84%, 60%)' // 紅色
    }
    if (settings.value?.mode === 'class-total') {
        return 'hsl(217, 91%, 60%)' // 藍色
    }
    if (settings.value?.mode === 'group-based') {
        return 'hsl(142, 76%, 36%)' // 深綠色
    }
    return 'hsl(38, 92%, 50%)' // 黃色
})

// Tooltip 文字（詳細資訊）
const tooltipText = computed(() => {
    if (!settings.value) return displayText.value

    if (settings.value.mode === 'group-based') {
        return `各組獨立｜💰 ${settings.value.pointsPerStar}分=1星 / ⭐ ${settings.value.starsToInvincible}星無敵 / ⏱️ ${formatDurationDisplay(settings.value.invincibleDurationSeconds)}`
    } else if (settings.value.mode === 'class-total') {
        return `全班協作｜🎯 ${settings.value.classTotalTargetPoints}分無敵 / ⏱️ ${formatDurationDisplay(settings.value.invincibleDurationSeconds)}`
    }

    return displayText.value
})
</script>
