<template>
    <div class="relative">
        <div
            class="rounded-lg transition-colors overflow-hidden"
            :class="[
                group.isInvincible
                    ? 'border border-amber-200 bg-amber-50/70 text-amber-700 invincible-activate px-3 py-2'
                    : 'text-base-content/70 px-1.5 py-1 sm:px-2 sm:py-1.5',
            ]"
        >
            <template v-if="group.isInvincible">
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 font-medium">
                            <LucideIcon
                                name="Zap"
                                class="w-4 h-4 text-amber-500 invincible-pulse"
                            />
                            <span>無敵</span>
                        </div>
                        <span
                            :class="[
                                'font-semibold text-amber-600',
                                countdownCritical ? 'countdown-critical' : '',
                            ]"
                        >
                            {{ formattedTimer }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="invincible-progress flex-1">
                            <div class="invincible-progress-track">
                                <div
                                    class="invincible-progress-fill"
                                    :style="{ width: `${invincibleProgress * 100}%` }"
                                ></div>
                            </div>
                        </div>
                        <span
                            v-if="queueCount > 0"
                            class="badge badge-sm border-none bg-amber-200 text-amber-700"
                        >
                            +{{ queueCount }} 次
                        </span>
                    </div>
                    <div class="flex items-center gap-1 text-xs text-amber-600">
                        <LucideIcon name="Star" class="w-3.5 h-3.5 text-yellow-400" />
                        <span>{{ totalStars }} 顆星</span>
                    </div>
                </div>
            </template>
            <template v-else>
                <!-- 星星資訊區：左（星星數）+ 中（進度條）+ 右（目標數） -->
                <div class="flex items-center gap-2 sm:gap-2.5">
                    <!-- 星星數量（左側，大而明顯） -->
                    <div class="flex items-center gap-1 shrink-0">
                        <LucideIcon name="Star" class="w-4 h-4 text-yellow-400 shrink-0" />
                        <span
                            class="text-base font-bold tabular-nums text-amber-600"
                            :class="starGainClass"
                        >
                            {{ totalStars }}
                        </span>
                    </div>

                    <!-- 進度條（中間，較粗且明顯） -->
                    <div class="flex-1 min-w-[40px]">
                        <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300"
                                :class="{ 'progress-flash': starProgress >= 1 }"
                                :style="{ width: `${starProgress * 100}%` }"
                            ></div>
                        </div>
                    </div>

                    <!-- 佇列提示（如果有） -->
                    <span
                        v-if="queueCount > 0"
                        class="badge badge-xs border-none bg-amber-200 text-amber-700 shrink-0"
                    >
                        +{{ queueCount }}
                    </span>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import LucideIcon from '~/components/LucideIcon.vue'
import type { Group } from '~/types/class'

defineProps<{
    group: Group
    formattedTimer: string
    totalStars: number
    starProgress: number
    invincibleProgress: number
    queueCount: number
    starGainClass: string | null
    countdownCritical: boolean
}>()
</script>

<style scoped>
@import '@/assets/score-animate.css';

/* 星星跳動動畫 */
@keyframes star-bounce {
    0% {
        transform: scale(1);
    }
    30% {
        transform: scale(1.3);
    }
    60% {
        transform: scale(0.9);
    }
    100% {
        transform: scale(1);
    }
}
.star-gain-animate {
    animation: star-bounce 0.5s ease-out;
}

/* 進度條填滿閃爍動畫 */
@keyframes progress-flash {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}
.progress-flash {
    animation: progress-flash 0.6s ease-in-out 3;
}

/* 無敵倒數跳動動畫 */
@keyframes countdown-pulse {
    0%,
    100% {
        transform: scale(1);
        color: #d97706;
    }
    50% {
        transform: scale(1.15);
        color: #ea580c;
    }
}
.countdown-critical {
    animation: countdown-pulse 1s infinite;
}
</style>
