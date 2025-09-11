<template>
    <div class="space-y-6">
        <!-- 分組控制面板 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex flex-wrap gap-4 items-center justify-between">
                    <div class="flex flex-wrap gap-4 items-center">
                        <!-- 組數控制 -->
                        <div class="form-control">
                            <label class="label mr-2">
                                <span class="label-text">組數</span>
                            </label>
                            <input
                                v-model.number="groupCount"
                                type="number"
                                min="2"
                                max="10"
                                class="input input-bordered w-20"
                                :disabled="classInfo.groupingActive"
                            />
                        </div>

                        <!-- 隨機分組 -->
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">&nbsp;</span>
                            </label>
                            <button
                                @click="randomAssignGroups"
                                class="btn btn-primary"
                                :disabled="classInfo.groupingActive"
                            >
                                <LucideIcon name="Shuffle" class="w-4 h-4 mr-2" />
                                一鍵隨機分組
                            </button>
                        </div>

                        <!-- 積分儀表板 -->
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">&nbsp;</span>
                            </label>
                            <button
                                @click="showGroupScoreboard"
                                class="btn btn-warning"
                                :disabled="groups.length === 0"
                            >
                                <LucideIcon name="Trophy" class="w-4 h-4 mr-2" />
                                積分儀表板
                            </button>
                        </div>
                    </div>

                    <!-- 分組狀態控制 -->
                    <div class="flex gap-2">
                        <button
                            v-if="!classInfo.groupingActive"
                            @click="startGrouping"
                            class="btn btn-success gap-2"
                            :disabled="groups.length === 0"
                        >
                            <LucideIcon name="Play" class="w-4 h-4" />
                            開始此次課堂分組
                        </button>
                        <button v-else @click="endGrouping" class="btn btn-error gap-2">
                            <LucideIcon name="Square" class="w-4 h-4" />
                            結束此次課堂分組
                        </button>
                    </div>
                </div>

                <!-- 分組狀態提示 -->
                <div v-if="classInfo.groupingActive" class="alert alert-info mt-4">
                    <LucideIcon name="Info" class="w-5 h-5" />
                    <span>分組模式進行中！學生可以開始小組活動，記得為各組加減分。</span>
                </div>
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
                class="flex-1 grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 content-start overflow-y-auto"
            >
                <!-- 各組 -->
                <div v-for="group in groups" :key="group.id" class="card bg-base-100 shadow-sm">
                    <div class="card-body">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="card-title text-base flex items-center">
                                <div
                                    class="w-4 h-4 rounded-full mr-2"
                                    :style="{ backgroundColor: group.color }"
                                ></div>
                                {{ group.name }}
                                <span class="badge badge-neutral ml-2"
                                    >{{ group.members.length }} 人</span
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
                            <div class="stat py-2">
                                <div class="stat-title text-xs">平均</div>
                                <div class="stat-value text-lg">
                                    {{ group.averageScore.toFixed(1) }}
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
                                v-for="member in group.members"
                                :key="member.id"
                                :class="[
                                    'p-2 bg-base-200 rounded cursor-move hover:bg-base-300 transition-colors',
                                    'flex justify-between items-center',
                                ]"
                                draggable="true"
                                @dragstart="handleDragStart(member.id)"
                            >
                                <div>
                                    <div class="font-medium text-sm">{{ member.name }}</div>
                                    <div class="text-xs text-base-content/70">{{ member.id }}</div>
                                </div>
                                <div class="text-xs font-semibold text-primary">
                                    {{ member.totalScore }}分
                                </div>
                            </div>

                            <div
                                v-if="group.members.length === 0"
                                class="text-center text-base-content/50 py-4 text-sm"
                            >
                                拖拽學生到此組
                            </div>
                        </div>

                        <!-- 快速評分 -->
                        <div class="flex gap-2 mt-3">
                            <button
                                @click="addGroupScore(group.id, 1)"
                                class="btn btn-success btn-xs flex-1"
                                :disabled="!classInfo.groupingActive"
                            >
                                +1
                            </button>
                            <button
                                @click="addGroupScore(group.id, -1)"
                                class="btn btn-error btn-xs flex-1"
                                :disabled="!classInfo.groupingActive"
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
                                {{ group.members.length }} 人
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-primary">
                                {{ group.totalScore }}
                            </div>
                            <div class="text-sm text-base-content/70">
                                平均 {{ group.averageScore.toFixed(1) }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-action">
                    <button @click="closeScoreboardModal" class="btn btn-ghost">關閉</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeScoreboardModal">close</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import type { ClassInfo, Student, Group } from '~/types'
import { ref, computed, watchEffect } from 'vue'

// Helper function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
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

// Modal refs
const scoreboardModal = ref<HTMLDialogElement>()

// State
const groupCount = ref(props.classInfo.groupCount || 4)
const draggedStudentId = ref<string | null>(null)
const localGroups = ref<Group[]>([])
const isUngroupedCollapsed = ref(false)

// Computed
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

// Methods
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
        averageScore: 0,
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
    updateGroupStats(group)

    if (shouldPersist) {
        persistGroups()
    }
}

const removeStudentFromGroups = (studentId: string, shouldPersist = true) => {
    localGroups.value.forEach((group) => {
        const memberIndex = group.members.findIndex((member) => member.id === studentId)
        if (memberIndex > -1) {
            group.members.splice(memberIndex, 1)
            updateGroupStats(group)
        }
    })
    if (shouldPersist) {
        persistGroups()
    }
}

const updateGroupStats = (group: Group) => {
    const memberIds = group.members.map((m) => m.id)
    const groupStudents = props.classInfo.students.filter((s) => memberIds.includes(s.id))

    const totalScores = groupStudents.reduce((sum, student) => sum + student.totalScore, 0)
    group.totalScore = totalScores
    group.averageScore = groupStudents.length > 0 ? totalScores / groupStudents.length : 0
}

const addGroupScore = (groupId: string, score: number) => {
    if (!props.classInfo.groupingActive) return
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
    classesStore.startClassGrouping(props.classInfo.id)
}

const endGrouping = () => {
    if (confirm('確定要結束此次分組嗎？')) {
        classesStore.endClassGrouping(props.classInfo.id)
    }
}

const showGroupScoreboard = () => {
    scoreboardModal.value?.showModal()
}

const closeScoreboardModal = () => {
    scoreboardModal.value?.close()
}

// Sync local state with store state
watchEffect(() => {
    // Use stringify/parse for a deep copy to avoid mutation issues
    localGroups.value = JSON.parse(JSON.stringify(props.classInfo.groups || []))
    groupCount.value = props.classInfo.groupCount || 4
})

</script>
