<template>
    <div class="flex items-center gap-2">
        <span :class="badgeClass">
            <LucideIcon :name="icon" class="w-3 h-3" />
            {{ displayText }}
        </span>
        <span v-if="showDetails && settings" class="text-xs text-base-content/60">
            ⭐{{ settings.starsToInvincible }}星→無敵 | 💰{{ settings.pointsPerStar }}分=1星
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ClassInfo, RewardSettings } from '~/types'
import { useRewardsStore } from '~/stores/rewards'

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
    } else if (props.classInfo.rewardSettingsMode === 'custom') {
        return props.classInfo.customRewardSettings
    }
    return null
})

// 顯示文字
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
    if (props.classInfo.rewardSettingsMode === 'custom') {
        return '自訂規則'
    }
    return '未設定'
})

// 圖標
const icon = computed(() => {
    if (props.classInfo.rewardSettingsMode === 'disabled') {
        return 'Ban'
    }
    if (props.classInfo.rewardSettingsMode === 'template') {
        return 'BookTemplate'
    }
    if (props.classInfo.rewardSettingsMode === 'custom') {
        return 'Sliders'
    }
    return 'AlertCircle'
})

// Badge 樣式
const badgeClass = computed(() => {
    const base = 'badge badge-sm gap-1'
    if (props.classInfo.rewardSettingsMode === 'disabled') {
        return `${base} badge-error badge-outline`
    }
    if (props.classInfo.rewardSettingsMode === 'template') {
        return `${base} badge-success`
    }
    if (props.classInfo.rewardSettingsMode === 'custom') {
        return `${base} badge-info`
    }
    return `${base} badge-warning badge-outline`
})
</script>
