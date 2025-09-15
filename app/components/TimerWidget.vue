<template>
    <div
        ref="widget"
        class="card fixed bottom-5 right-5 w-80 bg-base-200/80 shadow-xl backdrop-blur-md border border-base-300 z-50"
        :style="{ transform: `translate(${position.x}px, ${position.y}px)` }"
    >
        <div class="card-body p-4">
            <div
                ref="handle"
                class="card-title text-base cursor-move flex items-center justify-between mb-2"
            >
                <div class="flex items-center gap-2">
                    <LucideIcon name="Timer" class="w-5 h-5" />
                    <span>課堂計時器</span>
                </div>
                <button class="btn btn-xs btn-ghost btn-circle" @click="ui.toggleTimer(false)">
                    <LucideIcon name="X" class="w-4 h-4" />
                </button>
            </div>

            <div 
                @click="promptForTime"
                class="flex items-center justify-center text-center my-4 cursor-pointer tooltip tooltip-bottom"
                data-tip="點擊以自訂時間"
            >
                <span class="countdown font-mono text-6xl">
                    <span :style="`--value: ${minutes}`"></span>
                </span>
                <span class="font-mono text-6xl">:</span>
                <span class="countdown font-mono text-6xl">
                    <span :style="`--value: ${seconds}`"></span>
                </span>
            </div>

            <div class="grid grid-cols-3 gap-2 mb-4">
                <button class="btn btn-sm btn-outline" @click="ui.setTimer(5 * 60)">5分鐘</button>
                <button class="btn btn-sm btn-outline" @click="ui.setTimer(10 * 60)">10分鐘</button>
                <button class="btn btn-sm btn-outline" @click="ui.setTimer(15 * 60)">15分鐘</button>
            </div>

            <div class="card-actions justify-end">
                <button v-if="!ui.isTimerRunning" class="btn btn-primary btn-sm" @click="ui.startTimer" :disabled="ui.timerSecondsRemaining <= 0">
                    <LucideIcon name="Play" class="w-4 h-4" />
                    開始
                </button>
                <button v-else class="btn btn-warning btn-sm" @click="ui.pauseTimer">
                    <LucideIcon name="Pause" class="w-4 h-4" />
                    暫停
                </button>
                <button class="btn btn-ghost btn-sm" @click="ui.resetTimer">
                    <LucideIcon name="RotateCcw" class="w-4 h-4" />
                    重設
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useUIStore } from '~/stores/ui'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const ui = useUIStore()

const minutes = computed(() => Math.floor(ui.timerSecondsRemaining / 60))
const seconds = computed(() => ui.timerSecondsRemaining % 60)

const promptForTime = () => {
    const newTime = prompt("請輸入時間 (分:秒)", `${minutes.value}:${seconds.value.toString().padStart(2, '0')}`);
    if (newTime && /^\d{1,3}:\d{1,2}$/.test(newTime)) {
        const parts = newTime.split(':').map(Number);
        const newSeconds = parts[0] * 60 + parts[1];
        if (newSeconds > 0 && newSeconds <= 999 * 60 + 59) { // 增加上限避免輸入問題
            ui.setTimer(newSeconds);
        } else {
            alert("請輸入有效的時間範圍。");
        }
    } else if (newTime !== null) {
        alert("格式錯誤，請輸入如 '5:30' 的格式。");
    }
};

// --- Draggable Logic ---
const widget = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const position = ref({ x: 0, y: 0 })
let isDragging = false
let offset = { x: 0, y: 0 }

const onMouseDown = (e: MouseEvent) => {
    if (handle.value && handle.value.contains(e.target as Node)) {
        isDragging = true
        offset.x = e.clientX - position.value.x
        offset.y = e.clientY - position.value.y
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }
}

const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    position.value.x = e.clientX - offset.x
    position.value.y = e.clientY - offset.y
}

const onMouseUp = () => {
    isDragging = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
}

onMounted(() => {
    if (widget.value) {
        widget.value.addEventListener('mousedown', onMouseDown)
    }
})

onBeforeUnmount(() => {
    if (widget.value) {
        widget.value.removeEventListener('mousedown', onMouseDown)
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    // Ensure timer interval is cleared when component is unmounted
    ui.pauseTimer()
})
</script>