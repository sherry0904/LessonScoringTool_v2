<template>
    <!-- Absolute Bottom 窄條 - 相對於 GroupingTab 容器 -->
    <div
        class="fixed bottom-0 left-16 right-0 z-40 transition-all duration-300"
        :class="[
            isInvincible
                ? 'h-14 bg-gradient-to-r from-red-500/95 via-orange-500/95 to-yellow-400/95 border-t-2 border-yellow-300'
                : 'h-12 sm:h-14 bg-gradient-to-r from-yellow-400/90 via-orange-400/90 to-orange-500/90 border-t-2 border-yellow-500/50',
            isInvincible && 'animate-pulse-glow',
        ]"
        style="backdrop-filter: blur(8px)"
    >
        <div class="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
            <!-- 正常模式佈局 -->
            <template v-if="!isInvincible">
                <!-- 左側：標題 + 分數 -->
                <div class="flex items-center gap-2 sm:gap-3">
                    <span class="text-base sm:text-lg">📊</span>
                    <span class="font-bold text-white text-sm sm:text-base hidden sm:inline"
                        >全班</span
                    >
                    <span class="text-xl sm:text-2xl font-black text-white tabular-nums">
                        {{ currentTotal }}
                    </span>
                    <span class="text-white/70 text-sm sm:text-base">/</span>
                    <span class="text-base sm:text-lg font-semibold text-white/90">
                        {{ nextThreshold }}
                    </span>
                    <span class="text-white/70 text-sm sm:text-base">分</span>
                </div>

                <!-- 中間：迷你進度條 -->
                <div class="flex-1 max-w-md h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-white transition-all duration-500 ease-out"
                        :style="{ width: progressPercent + '%' }"
                    />
                </div>

                <!-- 右側：提示訊息 -->
                <div class="flex items-center gap-1 sm:gap-2 text-white/90">
                    <span class="text-xs sm:text-sm">💡</span>
                    <span class="text-xs sm:text-sm font-semibold whitespace-nowrap">
                        還差 <span class="text-white font-bold">{{ remainingPoints }}</span> 分
                    </span>
                </div>
            </template>

            <!-- 無敵模式佈局 -->
            <template v-else>
                <!-- 左側：無敵狀態 + 倒數 -->
                <div class="flex items-center gap-2 sm:gap-4">
                    <div class="flex items-center gap-1 sm:gap-2">
                        <span class="text-lg sm:text-xl animate-spin-slow">🌟</span>
                        <span class="font-bold text-white text-sm sm:text-base">無敵模式</span>
                    </div>

                    <div class="flex items-center gap-1">
                        <span
                            class="text-xl sm:text-2xl font-black text-white tabular-nums"
                            :class="{ 'text-red-200 animate-pulse': isCritical }"
                        >
                            {{ formattedTime }}
                        </span>
                    </div>
                </div>

                <!-- 中間：倒數進度條 -->
                <div class="flex-1 max-w-xs h-3 bg-white/30 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-white transition-all duration-300 ease-linear"
                        :style="{ width: countdownPercent + '%' }"
                    />
                </div>

                <!-- 右側：加分提示 + 分數 -->
                <div class="flex items-center gap-2 sm:gap-4">
                    <div class="px-2 sm:px-4 py-1 bg-white/20 rounded-full">
                        <span class="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                            每次
                            <span class="text-base sm:text-xl">+{{ invinciblePoints }}</span> 分
                        </span>
                    </div>
                    <span
                        class="text-xs sm:text-sm font-semibold text-white whitespace-nowrap hidden sm:inline"
                    >
                        {{ currentTotal }}/{{ nextThreshold }}
                    </span>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCountdownTimer } from '~/constants/rewards'

const props = defineProps<{
    currentTotal: number
    pointsPerInvincible: number
    triggerCount: number
    isInvincible: boolean
    invincibleSecondsRemaining?: number
    invinciblePoints?: number
    invincibleDurationSeconds?: number
}>()

const nextThreshold = computed(() => {
    const result = (props.triggerCount + 1) * props.pointsPerInvincible
    return result
})

const progressPercent = computed(() => {
    const current = props.currentTotal % props.pointsPerInvincible
    const percent = (current / props.pointsPerInvincible) * 100
    return Math.min(100, Math.max(0, percent))
})

const remainingPoints = computed(() => Math.max(0, nextThreshold.value - props.currentTotal))

const formattedTime = computed(() => {
    if (!props.invincibleSecondsRemaining) return '00:00'
    return formatCountdownTimer(props.invincibleSecondsRemaining)
})

const isCritical = computed(() => {
    return props.isInvincible && (props.invincibleSecondsRemaining ?? 0) <= 10
})

const countdownPercent = computed(() => {
    if (
        !props.isInvincible ||
        !props.invincibleDurationSeconds ||
        props.invincibleDurationSeconds <= 0
    ) {
        return 0
    }
    const totalDuration = props.invincibleDurationSeconds
    const remaining = props.invincibleSecondsRemaining ?? 0
    const percent = (remaining / totalDuration) * 100
    return Math.min(100, Math.max(0, percent))
})
</script>

<style scoped>
@keyframes pulse-glow {
    0%,
    100% {
        box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
    }
    50% {
        box-shadow: 0 0 40px rgba(251, 191, 36, 0.8);
    }
}

.animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes spin-slow {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.animate-spin-slow {
    animation: spin-slow 3s linear infinite;
}
</style>
