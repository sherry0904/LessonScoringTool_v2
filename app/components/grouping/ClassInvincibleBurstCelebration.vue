<template>
    <!-- 全螢幕慶祝覆蓋層 -->
    <Teleport to="body">
        <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-50 translate-y-full"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-90"
        >
            <div
                v-if="visible"
                class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 overflow-hidden"
            >
                <button
                    type="button"
                    class="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white transition-colors"
                    aria-label="關閉慶祝畫面"
                    @click="handleManualClose"
                >
                    <LucideIcon name="X" class="w-6 h-6" />
                </button>

                <!-- 煙火粒子效果 -->
                <div class="absolute inset-0 pointer-events-none z-0">
                    <div
                        v-for="i in particleCount"
                        :key="i"
                        class="firework-particle"
                        :style="getParticleStyle(i)"
                    />
                </div>

                <!-- 星星爆炸效果 -->
                <div class="absolute inset-0 pointer-events-none z-0">
                    <div
                        v-for="i in starCount"
                        :key="'star-' + i"
                        class="star-burst"
                        :style="getStarStyle(i)"
                    >
                        ⭐
                    </div>
                </div>

                <!-- 主要文字內容 -->
                <div class="relative z-10 text-center px-4">
                    <!-- 標題 -->
                    <h1
                        class="text-5xl sm:text-7xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl animate-bounce-in"
                    >
                        🌟🌟🌟
                    </h1>

                    <h2
                        class="text-4xl sm:text-6xl font-black text-white mb-3 sm:mb-4 drop-shadow-2xl animate-scale-pulse"
                    >
                        全班無敵星星
                    </h2>

                    <!-- 達成分數 -->
                    <div
                        class="text-2xl sm:text-4xl font-bold text-white/90 mb-4 sm:mb-8 animate-fade-in-up"
                    >
                        達成 {{ achievedScore }} 分！
                    </div>

                    <!-- 倒數提示（可選） -->
                    <div
                        v-if="showCountdown && (countdownFormatted || countdownFallbackText)"
                        class="text-base sm:text-xl text-white/80 animate-fade-in-delayed"
                    >
                        <template v-if="countdownFormatted">
                            無敵模式剩餘
                            <span class="font-black text-white tabular-nums mx-1">
                                {{ countdownFormatted }}
                            </span>
                        </template>
                        <template v-else>
                            {{ countdownFallbackText }}
                        </template>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import LucideIcon from '~/components/LucideIcon.vue'
import { formatCountdownTimer } from '~/constants/rewards'

const props = defineProps<{
    visible: boolean
    achievedScore: number
    duration?: number
    showCountdown?: boolean
    countdownSeconds?: number
}>()

const emit = defineEmits<{
    (event: 'close'): void
}>()

const AUTO_CLOSE_DELAY_MS = 3200

// 根據螢幕大小調整粒子數量
const isSmallScreen = computed(() => {
    if (!process.client) return false
    return window.innerWidth < 1024
})

const particleCount = computed(() => (isSmallScreen.value ? 10 : 20))
const starCount = computed(() => (isSmallScreen.value ? 15 : 30))

const countdownFormatted = computed(() => {
    if (typeof props.countdownSeconds === 'number' && props.countdownSeconds > 0) {
        return formatCountdownTimer(props.countdownSeconds)
    }
    return null
})

const countdownFallbackText = computed(() => {
    const duration = props.duration || 0
    return duration > 0 ? `無敵模式持續 ${duration} 秒` : ''
})

let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

const clearAutoCloseTimer = () => {
    if (autoCloseTimer) {
        clearTimeout(autoCloseTimer)
        autoCloseTimer = null
    }
}

const scheduleAutoClose = () => {
    clearAutoCloseTimer()
    autoCloseTimer = setTimeout(() => {
        emit('close')
    }, AUTO_CLOSE_DELAY_MS)
}

const handleManualClose = () => {
    emit('close')
}

// 粒子隨機位置和動畫
const getParticleStyle = (index: number) => {
    // 只在周圍邊緣產生粒子，避免中心
    const angle = (360 / particleCount.value) * index
    const distance = 45 + Math.random() * 20 // 距離中心 45-65%
    return {
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${distance}vh)`,
        animationDelay: `${Math.random() * 0.3}s`,
    }
}

const getStarStyle = (index: number) => {
    // 生成環形位置，避開中心文字區域
    const angle = (Math.PI * 2 * index) / 30 // 30 顆星分布在環周圍
    const radius = 35 + Math.random() * 15 // 距離中心 35-50%

    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius

    return {
        left: `${Math.max(0, Math.min(100, x))}%`,
        top: `${Math.max(0, Math.min(100, y))}%`,
        animationDelay: `${Math.random() * 0.5}s`,
        fontSize: `${1 + Math.random() * 2}rem`,
    }
}

// 音效播放
const playSound = () => {
    if (!process.client) return
    try {
        const audio = new Audio('/super-star.mp3')
        audio.volume = 0.65
        audio.play().catch(() => {
            /* 靜默忽略音效錯誤 */
        })
    } catch {
        /* ignore audio load errors */
    }
}

// 監聽 visible 變化，播放音效
let hasPlayedSound = false
const checkAndPlaySound = () => {
    if (props.visible && !hasPlayedSound) {
        playSound()
        hasPlayedSound = true
    } else if (!props.visible) {
        hasPlayedSound = false
    }
}

onMounted(() => {
    if (props.visible) {
        checkAndPlaySound()
        scheduleAutoClose()
    }
})

watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            checkAndPlaySound()
            scheduleAutoClose()
        } else {
            clearAutoCloseTimer()
            hasPlayedSound = false
        }
    },
    { immediate: true },
)

onUnmounted(() => {
    clearAutoCloseTimer()
    hasPlayedSound = false
})
</script>

<style scoped>
.firework-particle {
    @apply absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full;
    background: radial-gradient(circle, rgba(255, 200, 0, 0.8), rgba(255, 100, 0, 0.6));
    animation: firework-burst 1.5s ease-out forwards;
    box-shadow: 0 0 8px rgba(255, 150, 0, 0.8);
}

.star-burst {
    @apply absolute;
    animation: star-spin-fade 2s ease-out forwards;
}

@keyframes firework-burst {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(0);
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(3);
    }
}

@keyframes star-spin-fade {
    0% {
        opacity: 0;
        transform: scale(0) rotate(0deg);
    }
    30% {
        opacity: 1;
        transform: scale(1.5) rotate(180deg);
    }
    100% {
        opacity: 0;
        transform: scale(0.5) rotate(360deg);
    }
}

@keyframes bounce-in {
    0% {
        transform: scale(0);
    }
    50% {
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes scale-pulse {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

.animate-bounce-in {
    animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-scale-pulse {
    animation: scale-pulse 0.6s ease-in-out infinite;
}

.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out 0.1s both;
}

.animate-fade-in-delayed {
    animation: fadeIn 0.2s ease-out 0.3s both;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>
