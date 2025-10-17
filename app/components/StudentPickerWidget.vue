<template>
    <div
        ref="widgetEl"
        :style="widgetStyle"
        class="fixed top-0 left-0 z-40 w-11/12 max-w-md bg-base-200 rounded-lg shadow-xl border border-base-300 flex flex-col overflow-hidden"
    >
        <div
            @mousedown="onDragStart"
            class="flex items-center justify-between p-4 bg-base-300/50 cursor-move"
        >
            <h3 class="text-lg font-bold flex items-center gap-2">
                <LucideIcon name="Dices" />
                隨機抽籤
            </h3>
            <button class="btn btn-sm btn-ghost btn-circle" @click="ui.closePicker()">
                <LucideIcon name="X" />
            </button>
        </div>

        <div class="p-4 overflow-y-auto custom-scrollbar">
            <!-- New: Source Selector -->
            <div v-if="classGroups.length > 0" class="mb-4">
                <label for="picker-source" class="text-sm font-medium text-base-content/80"
                    >抽籤範圍</label
                >
                <select id="picker-source" v-model="pickerSource" class="select select-bordered select-sm w-full mt-1">
                    <option value="class">全班學生</option>
                    <option v-for="group in classGroups" :key="group.id" :value="group.id">
                        {{ group.name }}
                    </option>
                </select>
            </div>

            <div v-if="sourceStudents.length > 0">
                <!-- Winner Display -->
                <div
                    v-if="ui.pickerWinner && !ui.isPicking"
                    class="text-center my-8 animate-fade-in"
                >
                    <p class="text-lg text-base-content/70">抽中的是...</p>
                    <p class="text-6xl font-bold my-4 text-primary">{{ ui.pickerWinner.name }}</p>
                    <p class="text-2xl font-mono text-base-content/50">
                        座號: {{ ui.pickerWinner.id }}
                    </p>
                </div>

                <!-- Picker Animation -->
                <div
                    v-else-if="availableStudents.length > 0"
                    class="h-48 my-8 flex items-center justify-center overflow-hidden relative"
                >
                    <div
                        class="absolute inset-0 bg-gradient-to-b from-base-200 via-transparent to-base-200 z-10"
                    ></div>
                    <div
                        class="animate-picker-scroll text-4xl font-semibold text-center text-base-content/50"
                        v-if="ui.isPicking"
                    >
                        <div v-for="(name, i) in shuffledNames" :key="i">{{ name }}</div>
                    </div>
                    <div v-else class="text-2xl text-base-content/40">準備開始抽籤...</div>
                    <div
                        class="absolute top-1/2 left-0 right-0 h-16 -translate-y-1/2 border-y-2 border-primary/50 rounded-lg"
                    ></div>
                </div>

                <!-- All Picked Message -->
                <div v-else class="text-center py-10">
                    <p class="text-base-content/60">此範圍內所有學生都已經抽過了！</p>
                    <p class="text-sm text-base-content/40 mt-2">
                        可以點擊下方「清除」按鈕來重置名單。
                    </p>
                </div>

                <!-- Drawn Students List -->
                <div v-if="(ui.pickerDrawnStudents?.length ?? 0) > 0" class="mt-6">
                    <div class="divider text-sm">已抽過名單 ({{ ui.pickerDrawnStudents.length }}人)</div>
                    <div
                        class="bg-base-100 flex flex-wrap gap-2 justify-start items-start min-h-[32px] p-2 rounded-lg max-h-32 overflow-y-auto custom-scrollbar"
                    >
                        <button
                            v-for="student in ui.pickerDrawnStudents ?? []"
                            :key="student.id"
                            @click="ui.returnStudentToPool(student.id)"
                            class="flex items-center px-2 py-0.5 rounded-full bg-base-300 text-base-content font-medium shadow-sm transition hover:bg-error hover:text-error-content text-xs cursor-pointer border-none outline-none"
                            style="margin-bottom: 2px"
                            title="點擊將此學生放回抽籤池"
                        >
                            <span>{{ student.name }}</span>
                            <LucideIcon name="X" class="w-3 h-3 ml-1" />
                        </button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="mt-6 flex gap-2">
                    <button
                        class="btn btn-ghost flex-1"
                        @click="ui.clearDrawnStudents()"
                        :disabled="(ui.pickerDrawnStudents?.length ?? 0) === 0"
                    >
                        <LucideIcon name="Trash2" class="w-4 h-4" />
                        清除
                    </button>
                    <button
                        class="btn btn-primary btn-lg flex-[2]"
                        @click="ui.startPicking(availableStudents)"
                        :disabled="ui.isPicking || availableStudents.length === 0"
                    >
                        <span v-if="ui.isPicking" class="loading loading-spinner"></span>
                        {{ ui.pickerWinner ? '再抽一位' : '開始抽籤！' }}
                    </button>
                </div>
            </div>
            <div v-else class="text-center py-10">
                <p class="text-base-content/60">目前班級沒有學生可供抽籤。</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useUIStore } from '~/stores/ui'
import { useClassesStore } from '~/stores/classes'
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { Student, Group } from '~/types/class'

const ui = useUIStore()
const classesStore = useClassesStore()

// --- Data Sources ---
const classGroups = computed<Group[]>(() => classesStore.currentClass?.groups || [])

const pickerSource = computed<string>({
    get: () => ui.pickerSource,
    set: (value) => ui.setPickerSource(value),
})

const sourceStudents = computed<Student[]>(() => {
    const source = pickerSource.value
    if (source === 'class' || !classesStore.currentClass) {
        return classesStore.currentClass?.students || []
    }
    const selectedGroup = classGroups.value.find((g) => g.id === source)
    return selectedGroup?.members || []
})

const availableStudents = computed<Student[]>(() => {
    const drawnIds = new Set((ui.pickerDrawnStudents || []).map((s) => s.id))
    return sourceStudents.value.filter((s) => !drawnIds.has(s.id))
})

// --- Draggable Widget Logic ---
const widgetEl = ref<HTMLElement | null>(null)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const widgetStyle = computed(() => ({
    transform: `translate(${position.value.x}px, ${position.value.y}px)`,
}))

function onDragStart(event: MouseEvent) {
    if (!widgetEl.value) return
    isDragging.value = true

    dragOffset.value = {
        x: event.clientX - position.value.x,
        y: event.clientY - position.value.y,
    }

    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
    document.body.style.userSelect = 'none'
}

function onDragMove(event: MouseEvent) {
    if (!isDragging.value) return
    event.preventDefault()

    position.value = {
        x: event.clientX - dragOffset.value.x,
        y: event.clientY - dragOffset.value.y,
    }
}

function onDragEnd() {
    isDragging.value = false
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
    document.body.style.userSelect = ''

    ui.setPickerPosition(position.value)
}

onMounted(async () => {
    await nextTick()

    const savedPosition = ui.pickerPosition
    if (savedPosition) {
        position.value = savedPosition
    } else if (widgetEl.value) {
        const x = window.innerWidth - widgetEl.value.offsetWidth - 60
        const y = window.innerHeight - widgetEl.value.offsetHeight - 60
        position.value = { x: Math.max(x, 10), y: Math.max(y, 10) }
    } else {
        position.value = { x: 100, y: 100 }
    }
})

onUnmounted(() => {
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
})

// --- Picker Animation Logic ---

function fisherYatesShuffle(array: string[]): string[] {
    const arr = array.slice()
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

const shuffledNames = computed(() => {
    if (availableStudents.value.length === 0) return []

    let list: string[] = []
    for (let i = 0; i < 5; i++) {
        list = list.concat(fisherYatesShuffle(availableStudents.value.map((s) => s.name)))
    }

    if (ui.pickerWinner) {
        const winnerName = ui.pickerWinner.name
        const lastWinnerIndex = list.lastIndexOf(winnerName)
        if (lastWinnerIndex !== -1) {
            const secondToLastIndex = list.length - 2
            ;[list[lastWinnerIndex], list[secondToLastIndex]] = [
                list[secondToLastIndex],
                list[lastWinnerIndex],
            ]
        }
    }
    return list
})
</script>

<style scoped>
.animate-picker-scroll {
    animation: scroll 1.5s linear infinite;
    padding-top: 5rem;
    padding-bottom: 5rem;
}

@keyframes scroll {
    from {
        transform: translateY(-50%);
    }
    to {
        transform: translateY(0%);
    }
}

.animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.custom-scrollbar {
    scrollbar-color: theme('colors.base-300') theme('colors.base-200');
    scrollbar-width: thin;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: theme('colors.base-200');
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: theme('colors.base-300');
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: theme('colors.base-content/30');
}
</style>