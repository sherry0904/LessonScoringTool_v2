<template>
    <div class="space-y-6">
        <!-- 分組控制面板 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
                <!-- INACTIVE STATE: Setup Panel -->
                <template v-if="!classInfo.groupingActive">
                    <div class="flex flex-wrap gap-4 items-end justify-between">
                        <div class="flex flex-wrap gap-4 items-end">
                            <!-- 組數控制 -->
                            <div class="form-control">
                                <label class="label py-1 mr-2">
                                    <span class="label-text">組數</span>
                                </label>
                                <input
                                    v-model.number="groupCount"
                                    type="number"
                                    min="2"
                                    max="10"
                                    class="input input-bordered w-20"
                                />
                            </div>
                            <!-- 隨機分組 -->
                            <button @click="randomAssignGroups" class="btn btn-primary">
                                <LucideIcon name="Shuffle" class="w-4 h-4 mr-2" />
                                一鍵隨機分組
                            </button>
                        </div>
                        <!-- 開始分組 -->
                        <button
                            @click="startGrouping"
                            class="btn btn-success gap-2"
                            :disabled="localGroups.length === 0"
                        >
                            <LucideIcon name="Play" class="w-4 h-4" />
                            開始分組
                        </button>
                    </div>
                    <div class="flex flex-wrap gap-4 items-end mt-4 border-t pt-4">
                        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
                            <label class="whitespace-nowrap text-base-content/80 mr-2">活動名稱 (選填)</label>
                            <input
                                v-model="activityName"
                                type="text"
                                placeholder="例如：第二次分組討論"
                                class="input input-bordered flex-1 min-w-0"
                            />
                        </div>
                        <button
                            @click="showGroupScoreboard"
                            class="btn btn-warning ml-2"
                            :disabled="localGroups.length === 0"
                        >
                            <LucideIcon name="Trophy" class="w-4 h-4 mr-2" />
                            積分儀表板
                        </button>
                    </div>
                </template>

                <!-- ACTIVE STATE: Compact Control Bar -->
                <template v-else>
                    <div class="flex flex-wrap gap-x-4 gap-y-2 items-center justify-between">
                        <div class="flex items-center gap-3 flex-wrap">
                            <span class="flex items-center gap-2 text-info font-semibold">
                                <LucideIcon name="CircleDot" class="w-5 h-5 animate-pulse" />
                                <span>分組進行中</span>
                            </span>
                            <input
                                v-model="activityName"
                                type="text"
                                placeholder="請輸入活動名稱..."
                                class="input input-sm input-bordered w-auto max-w-xs"
                            />
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                @click="exportActivityReport"
                                class="btn btn-sm btn-info gap-1"
                                :disabled="!activityName.trim()"
                                title="匯出活動報告"
                            >
                                <LucideIcon name="Download" class="w-4 h-4" />
                                匯出
                            </button>
                            <button
                                @click="showGroupScoreboard"
                                class="btn btn-sm btn-warning gap-1"
                                title="顯示積分儀表板"
                            >
                                <LucideIcon name="Trophy" class="w-4 h-4" />
                                儀表板
                            </button>
                            <button @click="endGrouping" class="btn btn-sm btn-error gap-1">
                                <LucideIcon name="Square" class="w-4 h-4" />
                                結束分組
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- 分組容器 -->
        <div class="flex gap-6 h-[calc(100vh-220px)]">
            <!-- Left Panel: Ungrouped Students -->
            <aside
                :class="[
                    'transition-all duration-300 flex-shrink-0',
                    isUngroupedCollapsed ? 'w-20' : 'w-80',
                ]"
            >
                <div class="card bg-base-100 shadow-sm h-full flex flex-col">
                    <div class="card-body flex flex-col h-full">
                        <div class="flex items-center justify-between mb-4">
                            <h3
                                v-if="!isUngroupedCollapsed"
                                class="card-title text-base flex items-center whitespace-nowrap"
                            >
                                <LucideIcon name="Users" class="w-5 h-5 mr-2" />
                                未分組學生
                                <span class="badge badge-neutral ml-2"
                                    >{{ ungroupedStudents.length }} 人</span
                                >
                            </h3>
                            <button
                                @click="isUngroupedCollapsed = !isUngroupedCollapsed"
                                class="btn btn-ghost btn-sm btn-circle"
                                :title="isUngroupedCollapsed ? '展開' : '收合'"
                            >
                                <LucideIcon
                                    :name="isUngroupedCollapsed ? 'ChevronsRight' : 'ChevronsLeft'"
                                    class="w-4 h-4"
                                />
                            </button>
                        </div>

                        <div
                            v-if="!isUngroupedCollapsed"
                            class="flex-1 overflow-y-auto space-y-2 p-1"
                            @drop="handleDrop('unassigned')"
                            @dragover.prevent
                            @dragenter.prevent
                        >
                            <div
                                v-for="student in ungroupedStudents"
                                :key="student.id"
                                :class="[
                                    'p-3 bg-base-200 rounded-lg cursor-move hover:bg-base-300 transition-colors',
                                    'flex justify-between items-center',
                                ]"
                                draggable="true"
                                @dragstart="handleDragStart(student.id)"
                            >
                                <div>
                                    <div class="font-medium">{{ student.name }}</div>
                                    <div class="text-sm text-base-content/70">
                                        座號 {{ student.id }}
                                    </div>
                                </div>
                                <div class="text-sm font-semibold text-primary">
                                    {{ student.totalScore }}分
                                </div>
                            </div>

                            <div
                                v-if="ungroupedStudents.length === 0"
                                class="text-center text-base-content/50 py-8"
                            >
                                所有學生都已分組
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Right Panel: Groups -->
            <main
                class="flex-1 grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 content-start overflow-y-auto overflow-x-auto"
            >
                <!-- 各組 -->
                <div
                    v-for="group in localGroups"
                    :key="group.id"
                    class="card bg-base-100 shadow-sm"
                >
                    <div class="card-body">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="card-title text-base flex items-center">
                                <div
                                    class="w-4 h-4 rounded-full mr-2"
                                    :style="{ backgroundColor: group.color }"
                                ></div>
                                {{ group.name }}
                                <span class="badge badge-neutral ml-2"
                                    >{{ getGroupMembers(group).length }} 人</span
                                >
                            </h3>

                            <div class="dropdown dropdown-end">
                                <div
                                    tabindex="0"
                                    role="button"
                                    class="btn btn-ghost btn-sm btn-circle"
                                >
                                    <LucideIcon name="MoreVertical" class="w-4 h-4" />
                                </div>
                                <ul
                                    tabindex="0"
                                    class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow"
                                >
                                    <li>
                                        <a @click="editGroupName(group.id)">
                                            <LucideIcon name="Edit" class="w-4 h-4" />
                                            編輯組名
                                        </a>
                                    </li>
                                    <li>
                                        <a @click="addGroupScore(group.id, 1)" class="text-success">
                                            <LucideIcon name="Plus" class="w-4 h-4" />
                                            加 1 分
                                        </a>
                                    </li>
                                    <li>
                                        <a @click="addGroupScore(group.id, -1)" class="text-error">
                                            <LucideIcon name="Minus" class="w-4 h-4" />
                                            扣 1 分
                                        </a>
                                    </li>
                                    <li>
                                        <a @click="deleteGroup(group.id)" class="text-error">
                                            <LucideIcon name="Trash2" class="w-4 h-4" />
                                            刪除組別
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <!-- 組別總分 -->
                        <div class="stats shadow mb-3">
                            <div class="stat py-2">
                                <div class="stat-title text-xs">總分</div>
                                <div class="stat-value text-lg text-primary">
                                    {{ group.totalScore }}
                                </div>
                            </div>
                        </div>

                        <!-- 組員列表 -->
                        <div
                            class="min-h-32 p-3 border-2 border-dashed border-base-300 rounded-lg space-y-2"
                            @drop="handleDrop(group.id)"
                            @dragover.prevent
                            @dragenter.prevent
                        >
                            <div
                                v-for="member in getGroupMembers(group)"
                                :key="member.id"
                                :class="[
                                    'p-2 rounded cursor-move flex justify-between items-center transition-colors',
                                    member.isPresent
                                        ? 'bg-base-200 hover:bg-base-300'
                                        : 'bg-gray-200 text-gray-400 opacity-60',
                                ]"
                                draggable="true"
                                @dragstart="handleDragStart(member.id)"
                            >
                                <div>
                                    <div class="font-medium text-sm flex items-center">
                                        {{ member.name }}
                                        <span
                                            v-if="!member.isPresent"
                                            class="ml-2 px-2 py-0.5 rounded bg-gray-300 text-xs text-gray-600"
                                            >今日缺席</span
                                        >
                                    </div>
                                    <div class="text-xs text-base-content/70">{{ member.id }}</div>
                                </div>
                                <div
                                    class="text-xs font-semibold text-primary flex items-center gap-1"
                                >
                                    <template v-if="props.classInfo.groupingActive">
                                        <span class="opacity-60">{{
                                            baseScoresForClass[member.id] ?? ''
                                        }}</span>
                                        <LucideIcon
                                            name="ArrowRight"
                                            class="w-3 h-3 text-success"
                                        />
                                        <span class="text-success font-bold">{{
                                            (baseScoresForClass[member.id] ?? 0) +
                                            (sessionScoresForClass[member.id] ?? 0)
                                        }}</span>
                                        <span class="text-success">分</span>
                                    </template>
                                    <template v-else> {{ member.totalScore }}分 </template>
                                </div>
                            </div>

                            <div
                                v-if="getGroupMembers(group).length === 0"
                                class="text-center text-base-content/50 py-4 text-sm"
                            >
                                拖拽學生到此組
                            </div>
                        </div>

                        <!-- 快速評分 -->
                        <div class="flex gap-2 mt-3">
                            <button
                                @click="addGroupScore(group.id, 1)"
                                class="btn btn-success btn-sm flex-1"
                                :disabled="
                                    !classInfo.groupingActive ||
                                    getGroupMembers(group).every((m) => !m.isPresent)
                                "
                                :title="
                                    getGroupMembers(group).every((m) => !m.isPresent)
                                        ? '本組全員缺席，無法加分'
                                        : ''
                                "
                            >
                                +1
                            </button>
                            <button
                                @click="addGroupScore(group.id, -1)"
                                class="btn btn-error btn-sm flex-1"
                                :disabled="
                                    !classInfo.groupingActive ||
                                    getGroupMembers(group).every((m) => !m.isPresent)
                                "
                                :title="
                                    getGroupMembers(group).every((m) => !m.isPresent)
                                        ? '本組全員缺席，無法扣分'
                                        : ''
                                "
                            >
                                -1
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <!-- 積分儀表板模態 -->
        <dialog ref="scoreboardModal" class="modal">
            <div class="modal-box w-11/12 max-w-4xl">
                <h3 class="text-lg font-bold mb-4 flex items-center">
                    <LucideIcon name="Trophy" class="w-5 h-5 mr-2" />
                    小組積分儀表板
                </h3>

                <div class="space-y-4">
                    <!-- 排行榜 -->
                    <div
                        v-for="(group, index) in sortedGroups"
                        :key="group.id"
                        :class="[
                            'flex items-center gap-4 p-4 rounded-lg',
                            index === 0
                                ? 'bg-warning/20'
                                : index === 1
                                  ? 'bg-info/20'
                                  : index === 2
                                    ? 'bg-accent/20'
                                    : 'bg-base-200',
                        ]"
                    >
                        <div class="text-2xl font-bold w-8">
                            {{ index + 1 }}
                        </div>
                        <div
                            class="w-6 h-6 rounded-full"
                            :style="{ backgroundColor: group.color }"
                        ></div>
                        <div class="flex-1">
                            <div class="font-semibold">{{ group.name }}</div>
                            <div class="text-sm text-base-content/70">
                                {{ getGroupMembers(group).length }} 人
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-primary">
                                {{ group.totalScore }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-action">
                    <div v-if="isEndingFlow" class="w-full">
                        <div class="flex justify-between items-center flex-wrap gap-y-2 gap-x-4">
                            <div class="flex gap-2 flex-wrap">
                                <button
                                    @click="exportActivityReport"
                                    class="btn btn-info"
                                    :disabled="!activityName.trim()"
                                >
                                    <LucideIcon name="Download" class="w-4 h-4 mr-2" />
                                    匯出活動報表
                                </button>
                                <button @click="resetGroupScores" class="btn btn-warning">
                                    結束並重設分數
                                </button>
                                <button @click="confirmEndGrouping" class="btn btn-success">
                                    結束並保留分數
                                </button>
                            </div>
                            <button @click="closeScoreboardModal" class="btn btn-ghost">
                                取消
                            </button>
                        </div>
                        <p class="text-xs text-base-content/60 mt-3 w-full">
                            提醒：活動結束後就不可再匯出此次分組活動的報告。
                        </p>
                    </div>
                    <div v-else class="w-full flex justify-end">
                        <button @click="closeScoreboardModal" class="btn">關閉</button>
                    </div>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeScoreboardModal">close</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import type { ClassInfo, Student, Group } from '~/types'

// Helper function for debouncing
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(() => {
            func.apply(this, args)
        }, wait)
    }
}

interface Props {
    classInfo: ClassInfo
}

const props = defineProps<Props>()
const classesStore = useClassesStore()

// --- Use Store as the Single Source of Truth ---
const { groupingBaseScores, groupingSessionScores } = storeToRefs(classesStore)

// Modal refs
const scoreboardModal = ref<HTMLDialogElement>()

// Component-local state
const groupCount = ref(props.classInfo.groupCount || 4)
const draggedStudentId = ref<string | null>(null)
const localGroups = ref<Group[]>([])
const isUngroupedCollapsed = ref(false)
const activityName = ref('') // New state for the activity name
const isEndingFlow = ref(false)

// --- Computed Properties for easier template access ---
const baseScoresForClass = computed(() => groupingBaseScores.value[props.classInfo.id] || {})
const sessionScoresForClass = computed(() => groupingSessionScores.value[props.classInfo.id] || {})

const ungroupedStudents = computed(() => {
    return props.classInfo.students.filter(
        (student) =>
            student.isPresent &&
            !localGroups.value.some((group) =>
                group.members.some((member) => member.id === student.id),
            ),
    )
})

const sortedGroups = computed(() => {
    return [...localGroups.value].sort((a, b) => b.totalScore - a.totalScore)
})

// --- Methods ---

const getGroupMembers = (group: Group) => {
    // Returns real-time student information from props, not the potentially stale snapshot in group.members
    return group.members.map((member) => {
        const currentStudent = props.classInfo.students.find((s) => s.id === member.id)
        return currentStudent || member
    })
}

const persistGroups = debounce(() => {
    classesStore.updateGroups(props.classInfo.id, localGroups.value)
}, 500)

const initializeGroups = () => {
    localGroups.value = []
    for (let i = 1; i <= groupCount.value; i++) {
        createGroup(`第 ${i} 組`, false) // Don't persist for each creation
    }
    persistGroups()
}

const createGroup = (name: string, shouldPersist = true) => {
    const newGroup: Group = {
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        members: [],
        totalScore: 0,
        averageScore: 0, // This field is not used
        createdAt: new Date(),
        color: generateGroupColor(),
    }
    localGroups.value.push(newGroup)
    if (shouldPersist) {
        persistGroups()
    }
    return newGroup
}

const generateGroupColor = () => {
    const colors = [
        '#3b82f6',
        '#ef4444',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ec4899',
        '#06b6d4',
        '#84cc16',
    ]
    return colors[localGroups.value.length % colors.length]
}

const randomAssignGroups = () => {
    if (confirm('這將重新分配所有學生，確定要繼續嗎？')) {
        localGroups.value = []
        for (let i = 1; i <= groupCount.value; i++) {
            createGroup(`第 ${i} 組`, false)
        }

        const presentStudents = props.classInfo.students.filter((s) => s.isPresent)
        const shuffledStudents = [...presentStudents].sort(() => Math.random() - 0.5)
        shuffledStudents.forEach((student, index) => {
            const groupIndex = index % groupCount.value
            addStudentToGroup(student.id, localGroups.value[groupIndex].id, false)
        })
        persistGroups()
    }
}

const handleDragStart = (studentId: string) => {
    draggedStudentId.value = studentId
}

const handleDrop = (targetId: string) => {
    if (!draggedStudentId.value) return

    if (targetId === 'unassigned') {
        removeStudentFromGroups(draggedStudentId.value)
    } else {
        addStudentToGroup(draggedStudentId.value, targetId)
    }

    draggedStudentId.value = null
}

const addStudentToGroup = (studentId: string, groupId: string, shouldPersist = true) => {
    const student = props.classInfo.students.find((s) => s.id === studentId)
    const group = localGroups.value.find((g) => g.id === groupId)

    if (!student || !group) return

    removeStudentFromGroups(studentId, false) // Don't persist yet

    group.members.push({ ...student })

    if (shouldPersist) {
        persistGroups()
    }
}

const removeStudentFromGroups = (studentId: string, shouldPersist = true) => {
    localGroups.value.forEach((group) => {
        const memberIndex = group.members.findIndex((member) => member.id === studentId)
        if (memberIndex > -1) {
            group.members.splice(memberIndex, 1)
        }
    })
    if (shouldPersist) {
        persistGroups()
    }
}

const addGroupScore = (groupId: string, score: number) => {
    if (!props.classInfo.groupingActive) return
    // The store action now handles all the logic
    classesStore.addScoreToGroup(props.classInfo.id, groupId, score)
}

const editGroupName = (groupId: string) => {
    const group = localGroups.value.find((g) => g.id === groupId)
    if (!group) return

    const newName = prompt('請輸入新的組名：', group.name)
    if (newName && newName.trim()) {
        group.name = newName.trim()
        persistGroups()
    }
}

const deleteGroup = (groupId: string) => {
    if (confirm('確定要刪除此組別嗎？組內學生將移至未分組。')) {
        const groupIndex = localGroups.value.findIndex((g) => g.id === groupId)
        if (groupIndex > -1) {
            localGroups.value.splice(groupIndex, 1)
            persistGroups()
        }
    }
}

const startGrouping = () => {
    // The store action now handles all the logic
    classesStore.startClassGrouping(props.classInfo.id)
}

const endGrouping = () => {
    isEndingFlow.value = true
    scoreboardModal.value?.showModal()
}

const confirmEndGrouping = () => {
    classesStore.endClassGrouping(props.classInfo.id)
    // No need to clear local state, the watchEffect will handle it
    closeScoreboardModal()
}

const resetGroupScores = () => {
    if (confirm('確認要重設各組分數嗎？這將清除所有組別的總分。')) {
        localGroups.value.forEach((group) => {
            group.totalScore = 0
        })
        persistGroups()
        confirmEndGrouping()
    }
}

const showGroupScoreboard = () => {
    isEndingFlow.value = false
    scoreboardModal.value?.showModal()
}

const closeScoreboardModal = () => {
    scoreboardModal.value?.close()
    isEndingFlow.value = false // Reset state
}

const exportActivityReport = () => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
    const fileName = `${activityName.value || '分組活動報告'}-${props.classInfo.name}-${dateStr}.csv`

    const header = ['組別名稱', '組別得分', '組員座號', '組員姓名', '組員總分']
    const rows = []

    // Add metadata to the top of the CSV
    rows.push([`活動名稱: ${activityName.value || '未命名'}`])
    rows.push([`班級: ${props.classInfo.name}`])
    rows.push([`匯出日期: ${today.toLocaleString('zh-TW')}`])
    rows.push([]) // Add a blank row for spacing
    rows.push(header)

    localGroups.value.forEach((group) => {
        const members = getGroupMembers(group)
        if (members.length > 0) {
            members.forEach((member) => {
                const student = props.classInfo.students.find((s) => s.id === member.id)
                if (student) {
                    rows.push([
                        group.name,
                        group.totalScore,
                        student.id,
                        student.name,
                        student.totalScore,
                    ])
                }
            })
        } else {
            rows.push([group.name, group.totalScore, 'N/A', '本組無成員', 'N/A'])
        }
    })

    // Function to escape CSV fields
    const escapeCsvField = (field: any): string => {
        const str = String(field)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    const csvContent = rows.map((row) => row.map(escapeCsvField).join(',')).join('\n')

    // Create a Blob and trigger download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}

// Sync local state with the store/props state
watchEffect(() => {
    // Use stringify/parse for a deep copy to avoid mutation issues
    localGroups.value = JSON.parse(JSON.stringify(props.classInfo.groups || []))
    groupCount.value = props.classInfo.groupCount || 4
})
</script>
