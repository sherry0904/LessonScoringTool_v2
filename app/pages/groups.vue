<template>
    <div class="p-6 max-w-7xl mx-auto space-y-8">
        <!-- 標題區 -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1
                    class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                >
                    分組管理
                </h1>
                <p class="text-base-content/70 mt-2">建立、進行與追蹤課堂分組</p>
            </div>
            <div class="flex gap-2">
                <button
                    class="btn btn-outline gap-2"
                    @click="generateDraft"
                    :disabled="!selectedClassId"
                >
                    <LucideIcon name="Wand2" class="w-4 h-4" />
                    生成草稿
                </button>
                <button class="btn btn-primary gap-2" @click="startSession" :disabled="!canStart">
                    <LucideIcon name="Play" class="w-4 h-4" /> 開始分組
                </button>
                <button class="btn btn-warning gap-2" v-if="activeSession" @click="endSession">
                    <LucideIcon name="Square" class="w-4 h-4" /> 結束
                </button>
            </div>
        </div>

        <!-- 選擇班級與設定 -->
        <div class="grid gap-6 md:grid-cols-3">
            <div class="md:col-span-1 space-y-4">
                <div class="card bg-base-100 border border-base-300 shadow-sm">
                    <div class="card-body space-y-4">
                        <h2 class="card-title text-base">選擇班級</h2>
                        <select v-model="selectedClassId" class="select select-bordered w-full">
                            <option disabled value="">請選擇班級</option>
                            <option v-for="c in classesStore.classes" :key="c.id" :value="c.id">
                                {{ c.name }} ({{ c.students.length }})
                            </option>
                        </select>

                        <div class="space-y-2" v-if="selectedClass">
                            <label class="text-sm font-medium opacity-70">分組方式</label>
                            <div class="flex gap-2 flex-wrap">
                                <button
                                    v-for="m in modes"
                                    :key="m.value"
                                    @click="mode = m.value"
                                    class="btn btn-xs"
                                    :class="mode === m.value ? 'btn-primary' : 'btn-outline'"
                                >
                                    {{ m.label }}
                                </button>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4" v-if="selectedClass">
                            <div>
                                <label class="label-text text-xs opacity-70">組數</label>
                                <input
                                    type="number"
                                    v-model.number="groupCount"
                                    min="2"
                                    class="input input-bordered input-sm w-full"
                                />
                            </div>
                            <div>
                                <label class="label-text text-xs opacity-70">每組人數(參考)</label>
                                <div class="h-9 flex items-center text-sm font-medium">
                                    ~ {{ estimatedPerGroup }} 人
                                </div>
                            </div>
                        </div>

                        <div v-if="draftGroups.length" class="pt-2 border-t border-base-300">
                            <p class="text-xs opacity-70 mb-2">草稿：拖曳調整或重新生成</p>
                            <button class="btn btn-xs btn-outline w-full" @click="regenerate">
                                <LucideIcon name="RefreshCw" class="w-3 h-3" /> 重新生成
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="activeSession" class="card bg-base-100 border border-success shadow-sm">
                    <div class="card-body space-y-2">
                        <h2 class="card-title text-base flex items-center gap-2 text-success">
                            <LucideIcon name="Timer" class="w-5 h-5" /> 進行中
                        </h2>
                        <div class="text-sm">
                            開始時間：{{ formatTime(activeSession.startedAt) }}
                        </div>
                        <div class="text-sm" v-if="activeSession.endedAt">
                            結束：{{ formatTime(activeSession.endedAt) }}
                        </div>
                        <div class="text-sm" v-else>已進行：{{ elapsed }}</div>
                        <div class="flex gap-2">
                            <button class="btn btn-xs btn-outline" @click="endSession">
                                結束並保存
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 草稿 / 進行中分組區 -->
            <div class="md:col-span-2 space-y-6">
                <div v-if="draftGroups.length && !activeSession" class="space-y-4">
                    <h2 class="font-semibold flex items-center gap-2">
                        <LucideIcon name="Hammer" class="w-5 h-5" /> 草稿分組
                    </h2>
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div
                            v-for="(g, idx) in draftGroups"
                            :key="g.id"
                            class="bg-base-100 border border-base-300 rounded-xl p-4 space-y-2"
                        >
                            <div class="flex items-center justify-between">
                                <span class="font-medium"
                                    >第 {{ idx + 1 }} 組 ({{ g.members.length }})</span
                                >
                                <button class="btn btn-ghost btn-xs" @click="removeGroup(idx)">
                                    <LucideIcon name="X" class="w-3 h-3" />
                                </button>
                            </div>
                            <ul class="text-sm space-y-1">
                                <li
                                    v-for="m in g.members"
                                    :key="m.id"
                                    class="flex items-center gap-1"
                                >
                                    <LucideIcon name="User" class="w-3 h-3 opacity-60" />
                                    {{ m.name }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div v-if="activeSession" class="space-y-4">
                    <h2 class="font-semibold flex items-center gap-2">
                        <LucideIcon name="Users" class="w-5 h-5" /> 進行中分組
                    </h2>
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div
                            v-for="(g, idx) in activeSession.groups"
                            :key="g.id"
                            class="bg-base-100 border border-base-300 rounded-xl p-4 space-y-2"
                        >
                            <div class="flex items-center justify-between">
                                <span class="font-medium"
                                    >第 {{ idx + 1 }} 組 ({{ g.members.length }})</span
                                >
                            </div>
                            <ul class="text-sm space-y-1">
                                <li
                                    v-for="m in g.members"
                                    :key="m.id"
                                    class="flex items-center gap-1"
                                >
                                    <LucideIcon name="User" class="w-3 h-3 opacity-60" />
                                    {{ m.name }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div
                    v-if="!draftGroups.length && !activeSession"
                    class="p-12 text-center bg-base-100 rounded-2xl border border-dashed border-base-300"
                >
                    <LucideIcon name="Boxes" class="w-14 h-14 mx-auto mb-6 text-base-content/40" />
                    <h3 class="text-xl font-bold mb-2">準備開始分組</h3>
                    <p class="text-base-content/60 mb-6">
                        選擇班級與參數，點擊「生成草稿」即可快速預覽分組結果
                    </p>
                    <button
                        class="btn btn-primary gap-2"
                        :disabled="!selectedClassId"
                        @click="generateDraft"
                    >
                        <LucideIcon name="Wand2" class="w-4 h-4" /> 生成草稿
                    </button>
                </div>

                <div v-if="history.length" class="space-y-4">
                    <h2 class="font-semibold flex items-center gap-2">
                        <LucideIcon name="History" class="w-5 h-5" /> 歷史紀錄
                    </h2>
                    <div class="space-y-2">
                        <div
                            v-for="h in history"
                            :key="h.id"
                            class="collapse collapse-arrow border border-base-300 bg-base-100"
                        >
                            <input type="checkbox" />
                            <div class="collapse-title text-sm font-medium flex items-center gap-3">
                                <LucideIcon name="Calendar" class="w-4 h-4 opacity-60" />
                                {{ formatTime(h.startedAt) }}
                                <span class="text-xs opacity-60">{{ h.className }}</span>
                                <span class="text-xs" v-if="h.endedAt"
                                    >耗時 {{ formatDuration(h.startedAt, h.endedAt) }}</span
                                >
                            </div>
                            <div class="collapse-content">
                                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-2">
                                    <div
                                        v-for="(g, idx) in h.groups"
                                        :key="g.id"
                                        class="bg-base-200 rounded-lg p-3"
                                    >
                                        <div class="text-xs font-semibold mb-1">
                                            第 {{ idx + 1 }} 組 ({{ g.members.length }})
                                        </div>
                                        <ul class="text-xs space-y-0.5">
                                            <li v-for="m in g.members" :key="m.id">{{ m.name }}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="mt-3 flex gap-2">
                                    <button class="btn btn-xs btn-outline" @click="reuse(h)">
                                        <LucideIcon name="RotateCcw" class="w-3 h-3" /> 重用
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Student } from '~/types'
const classesStore = useClassesStore()

// 狀態
const selectedClassId = ref('')
const mode = ref<'balanced' | 'random' | 'fixed'>('random')
const groupCount = ref(4)

interface DraftGroup {
    id: string
    members: Student[]
}
interface SessionGroup {
    id: string
    members: Student[]
}
interface GroupSession {
    id: string
    classId: string
    className: string
    groups: SessionGroup[]
    startedAt: Date
    endedAt?: Date
}

const draftGroups = ref<DraftGroup[]>([])
const activeSession = ref<GroupSession | null>(null)
const history = ref<GroupSession[]>([])

const modes = [
    { value: 'random', label: '隨機' },
    { value: 'balanced', label: '均衡(佔位)' },
    { value: 'fixed', label: '固定(佔位)' },
]

const selectedClass = computed(
    () => classesStore.classes.find((c) => c.id === selectedClassId.value) || null,
)

const estimatedPerGroup = computed(() =>
    selectedClass.value ? Math.round(selectedClass.value.students.length / groupCount.value) : 0,
)

const canStart = computed(
    () => !!selectedClass.value && draftGroups.value.length > 0 && !activeSession.value,
)

// 生成草稿
const generateDraft = () => {
    if (!selectedClass.value) return
    const students = [...selectedClass.value.students]
    // 暫時僅隨機
    for (let i = students.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[students[i], students[j]] = [students[j], students[i]]
    }
    const groups: DraftGroup[] = Array.from({ length: groupCount.value }, (_, i) => ({
        id: `draft_${i}`,
        members: [],
    }))
    students.forEach((s, idx) => {
        groups[idx % groupCount.value].members.push(s)
    })
    draftGroups.value = groups
}

const regenerate = () => generateDraft()

const removeGroup = (idx: number) => {
    draftGroups.value.splice(idx, 1)
}

// 開始 / 結束分組
const startSession = () => {
    if (!canStart.value || !selectedClass.value) return
    activeSession.value = {
        id: `session_${Date.now()}`,
        classId: selectedClass.value.id,
        className: selectedClass.value.name,
        groups: draftGroups.value.map((g) => ({
            id: g.id.replace('draft', 'group'),
            members: g.members,
        })),
        startedAt: new Date(),
    }
    draftGroups.value = []
    classesStore.startClassGrouping(selectedClass.value.id)
}

const endSession = () => {
    if (!activeSession.value) return
    activeSession.value.endedAt = new Date()
    history.value.unshift(activeSession.value)
    classesStore.endClassGrouping(activeSession.value.classId)
    activeSession.value = null
}

const reuse = (h: GroupSession) => {
    draftGroups.value = h.groups.map((g) => ({ id: `draft_reuse_${g.id}`, members: g.members }))
    selectedClassId.value = h.classId
}

// 時間顯示
const formatTime = (d: Date) =>
    new Date(d).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
const formatDuration = (start: Date, end: Date) => {
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000
    const m = Math.floor(diff / 60)
    const s = Math.floor(diff % 60)
    return `${m}分${s}秒`
}

const elapsed = computed(() => {
    if (!activeSession.value) return ''
    const diff = (Date.now() - new Date(activeSession.value.startedAt).getTime()) / 1000
    const m = Math.floor(diff / 60)
    const s = Math.floor(diff % 60)
    return `${m}分${s}秒`
})

useHead({ title: '分組管理 - 班級經營動力站' })
</script>
