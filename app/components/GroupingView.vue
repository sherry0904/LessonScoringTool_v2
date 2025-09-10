<template>
    <div class="space-y-6">
        <!-- 分組控制區域 -->
        <div class="glass-card p-6 rounded-xl">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-base-content">分組模式</h1>
                    <p class="text-base-content/70">管理課堂分組，支援隨機分組和手動調整</p>
                </div>

                <div class="flex items-center space-x-3">
                    <div
                        :class="[
                            'badge',
                            classStore.isGroupingActive ? 'badge-success' : 'badge-neutral',
                        ]"
                    >
                        {{ classStore.isGroupingActive ? '分組進行中' : '未開始分組' }}
                    </div>

                    <div v-if="classStore.isGroupingActive" class="text-sm text-base-content/60">
                        已進行 {{ classStore.groupingDuration }} 分鐘
                    </div>
                </div>
            </div>

            <!-- 分組控制按鈕 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                    v-if="!classStore.isGroupingActive"
                    @click="startGrouping"
                    class="btn btn-primary"
                    :disabled="classStore.presentStudents.length === 0"
                >
                    <LucideIcon name="Play" class="w-4 h-4 mr-2" />
                    開始此次課堂分組
                </button>

                <button v-else @click="endGrouping" class="btn btn-error">
                    <LucideIcon name="Square" class="w-4 h-4 mr-2" />
                    結束此次課堂分組
                </button>

                <button
                    @click="openRandomGroupModal"
                    class="btn btn-secondary"
                    :disabled="classStore.presentStudents.length < 2"
                >
                    <LucideIcon name="Shuffle" class="w-4 h-4 mr-2" />
                    隨機分組
                </button>

                <button @click="openCreateGroupModal" class="btn btn-accent">
                    <LucideIcon name="Plus" class="w-4 h-4 mr-2" />
                    建立新群組
                </button>
            </div>

            <!-- 分組統計 -->
            <div v-if="classStore.groups.length > 0" class="stats shadow w-full mb-6">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <LucideIcon name="Users" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">群組數量</div>
                    <div class="stat-value text-primary">{{ classStore.groups.length }}</div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <LucideIcon name="UserCheck" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">已分組學生</div>
                    <div class="stat-value text-secondary">{{ groupedStudentsCount }}</div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-accent">
                        <LucideIcon name="UserX" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">未分組學生</div>
                    <div class="stat-value text-accent">{{ ungroupedStudentsCount }}</div>
                </div>
            </div>
        </div>

        <!-- 群組列表 -->
        <div v-if="classStore.groups.length === 0" class="glass-card p-8 rounded-xl text-center">
            <LucideIcon name="Users" class="w-16 h-16 text-base-content/30 mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-base-content mb-2">還沒有建立群組</h3>
            <p class="text-base-content/60 mb-4">開始建立群組來組織您的課堂活動</p>
            <button @click="openCreateGroupModal" class="btn btn-primary">建立第一個群組</button>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
                v-for="group in classStore.groups"
                :key="group.id"
                class="glass-card p-6 rounded-xl"
            >
                <!-- 群組標題 -->
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div
                            class="w-4 h-4 rounded-full"
                            :style="{ backgroundColor: group.color }"
                        ></div>
                        <h3 class="text-lg font-bold text-base-content">{{ group.name }}</h3>
                        <div class="badge badge-outline">{{ group.studentIds.length }} 人</div>
                    </div>

                    <div class="dropdown dropdown-end">
                        <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                            <LucideIcon name="MoreVertical" class="w-4 h-4" />
                        </label>
                        <ul
                            tabindex="0"
                            class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                        >
                            <li>
                                <a @click="editGroup(group)">
                                    <LucideIcon name="Edit" class="w-4 h-4" />
                                    編輯群組
                                </a>
                            </li>
                            <li>
                                <a @click="deleteGroup(group.id)" class="text-error">
                                    <LucideIcon name="Trash2" class="w-4 h-4" />
                                    刪除群組
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- 群組成員 -->
                <div class="space-y-2">
                    <div
                        v-for="studentId in group.studentIds"
                        :key="studentId"
                        class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                    >
                        <div class="flex items-center space-x-3">
                            <div class="avatar placeholder">
                                <div class="bg-primary text-primary-content rounded-full w-8">
                                    <span class="text-sm">{{
                                        getStudent(studentId)?.name.charAt(0)
                                    }}</span>
                                </div>
                            </div>
                            <div>
                                <div class="font-medium">{{ getStudent(studentId)?.name }}</div>
                                <div class="text-sm text-base-content/60">
                                    座號 {{ getStudent(studentId)?.number }}
                                </div>
                            </div>
                        </div>

                        <button
                            @click="removeStudentFromGroup(studentId, group.id)"
                            class="btn btn-ghost btn-xs text-error"
                            title="移出群組"
                        >
                            <LucideIcon name="X" class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- 如果群組為空 -->
                    <div
                        v-if="group.studentIds.length === 0"
                        class="text-center py-4 text-base-content/50"
                    >
                        這個群組還沒有成員
                    </div>
                </div>

                <!-- 新增成員 -->
                <div v-if="ungroupedStudents.length > 0" class="mt-4 pt-4 border-t border-base-300">
                    <select
                        @change="addStudentToGroup($event.target.value, group.id)"
                        class="select select-bordered select-sm w-full"
                    >
                        <option value="">新增學生到此群組...</option>
                        <option
                            v-for="student in ungroupedStudents"
                            :key="student.id"
                            :value="student.id"
                        >
                            {{ student.name }} ({{ student.number }})
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- 未分組學生 -->
        <div v-if="ungroupedStudents.length > 0" class="glass-card p-6 rounded-xl">
            <h3 class="text-lg font-bold text-base-content mb-4">未分組學生</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                    v-for="student in ungroupedStudents"
                    :key="student.id"
                    class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                >
                    <div class="flex items-center space-x-3">
                        <div class="avatar placeholder">
                            <div class="bg-gray-400 text-white rounded-full w-8">
                                <span class="text-sm">{{ student.name.charAt(0) }}</span>
                            </div>
                        </div>
                        <div>
                            <div class="font-medium">{{ student.name }}</div>
                            <div class="text-sm text-base-content/60">
                                座號 {{ student.number }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 隨機分組 Modal -->
    <div v-if="showRandomGroupModal" class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">隨機分組</h3>

            <div class="space-y-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">群組數量</span>
                    </label>
                    <input
                        v-model.number="randomGroupCount"
                        type="number"
                        min="2"
                        :max="Math.floor(classStore.presentStudents.length / 2)"
                        class="input input-bordered"
                    />
                    <label class="label">
                        <span class="label-text-alt">
                            建議 2-{{ Math.floor(classStore.presentStudents.length / 2) }} 個群組
                        </span>
                    </label>
                </div>

                <div class="form-control">
                    <label class="cursor-pointer label justify-start space-x-3">
                        <input
                            v-model="clearExistingGroups"
                            type="checkbox"
                            class="checkbox checkbox-primary"
                        />
                        <span class="label-text">清除現有群組</span>
                    </label>
                </div>
            </div>

            <div class="modal-action">
                <button @click="closeRandomGroupModal" class="btn btn-ghost">取消</button>
                <button
                    @click="performRandomGrouping"
                    class="btn btn-primary"
                    :disabled="randomGroupCount < 2"
                >
                    開始隨機分組
                </button>
            </div>
        </div>
        <div class="modal-backdrop" @click="closeRandomGroupModal"></div>
    </div>

    <!-- 建立群組 Modal -->
    <div v-if="showCreateGroupModal" class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">
                {{ editingGroup ? '編輯群組' : '建立新群組' }}
            </h3>

            <form @submit.prevent="saveGroup" class="space-y-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">群組名稱 *</span>
                    </label>
                    <input
                        v-model="groupForm.name"
                        type="text"
                        placeholder="請輸入群組名稱"
                        class="input input-bordered"
                        required
                    />
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">群組顏色</span>
                    </label>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="color in groupColors"
                            :key="color"
                            type="button"
                            @click="groupForm.color = color"
                            :class="[
                                'w-8 h-8 rounded-full border-2',
                                groupForm.color === color ? 'border-gray-800' : 'border-gray-300',
                            ]"
                            :style="{ backgroundColor: color }"
                        ></button>
                    </div>
                </div>

                <div class="modal-action">
                    <button type="button" @click="closeCreateGroupModal" class="btn btn-ghost">
                        取消
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="!groupForm.name">
                        {{ editingGroup ? '更新' : '建立' }}
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" @click="closeCreateGroupModal"></div>
    </div>
</template>

<script setup lang="ts">
import type { Student, Group } from '~/types'

const classStore = useClassStore()
const ui = useUIStore()

// 狀態
const showRandomGroupModal = ref(false)
const showCreateGroupModal = ref(false)
const editingGroup = ref<Group | null>(null)
const randomGroupCount = ref(4)
const clearExistingGroups = ref(false)

// 表單
const groupForm = ref({
    name: '',
    color: '#ef4444',
})

const groupColors = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
]

// 計算屬性
const groupedStudentsCount = computed(() => {
    return classStore.groups.reduce((total, group) => total + group.studentIds.length, 0)
})

const ungroupedStudentsCount = computed(() => {
    return classStore.presentStudents.length - groupedStudentsCount.value
})

const ungroupedStudents = computed(() => {
    const groupedStudentIds = classStore.groups.flatMap((group) => group.studentIds)
    // 僅顯示 isPresent 為 true 的學生（presentStudents 已經過濾 isPresent）
    return classStore.presentStudents.filter((student) => !groupedStudentIds.includes(student.id))
})

// 方法
const getStudent = (studentId: string): Student | undefined => {
    return classStore.students.find((s) => s.id === studentId)
}

const startGrouping = () => {
    classStore.startGrouping()
    ui.showSuccess('分組開始', '您現在可以建立小組並指派學生')
}

const endGrouping = () => {
    classStore.endGrouping()
    ui.showInfo('分組結束', `本次分組活動持續了 ${classStore.groupingDuration} 分鐘`)
}

const openRandomGroupModal = () => {
    randomGroupCount.value = Math.min(4, Math.floor(classStore.presentStudents.length / 3))
    clearExistingGroups.value = false
    showRandomGroupModal.value = true
}

const closeRandomGroupModal = () => {
    showRandomGroupModal.value = false
}

const performRandomGrouping = () => {
    if (clearExistingGroups.value) {
        // 清除現有群組
        classStore.groups.forEach((group) => {
            classStore.removeGroup(group.id)
        })
    }

    classStore.randomAssignGroups(randomGroupCount.value)
    ui.showSuccess('隨機分組完成', `已建立 ${randomGroupCount.value} 個群組`)
    closeRandomGroupModal()
}

const openCreateGroupModal = () => {
    editingGroup.value = null
    groupForm.value = {
        name: '',
        color: groupColors[Math.floor(Math.random() * groupColors.length)],
    }
    showCreateGroupModal.value = true
}

const closeCreateGroupModal = () => {
    showCreateGroupModal.value = false
    editingGroup.value = null
}

const editGroup = (group: Group) => {
    editingGroup.value = group
    groupForm.value = {
        name: group.name,
        color: group.color,
    }
    showCreateGroupModal.value = true
}

const saveGroup = () => {
    if (editingGroup.value) {
        classStore.updateGroup({
            ...editingGroup.value,
            name: groupForm.value.name,
            color: groupForm.value.color,
        })
        ui.showSuccess('群組已更新', `${groupForm.value.name} 已更新`)
    } else {
        classStore.createGroup({
            name: groupForm.value.name,
            color: groupForm.value.color,
        })
        ui.showSuccess('群組已建立', `${groupForm.value.name} 已建立`)
    }

    closeCreateGroupModal()
}

const deleteGroup = (groupId: string) => {
    const group = classStore.groups.find((g) => g.id === groupId)
    if (group && confirm(`確定要刪除群組「${group.name}」嗎？`)) {
        classStore.removeGroup(groupId)
        ui.showSuccess('群組已刪除', `${group.name} 已刪除`)
    }
}

const addStudentToGroup = (studentId: string, groupId: string) => {
    if (studentId) {
        classStore.assignStudentToGroup(studentId, groupId)
        const student = getStudent(studentId)
        if (student) {
            ui.showSuccess('學生已加入', `${student.name} 已加入群組`)
        }

        // 重置選擇
        const select = event?.target as HTMLSelectElement
        if (select) {
            select.value = ''
        }
    }
}

const removeStudentFromGroup = (studentId: string, groupId: string) => {
    const student = getStudent(studentId)
    if (student && confirm(`確定要將 ${student.name} 移出群組嗎？`)) {
        classStore.removeStudentFromGroup(studentId, groupId)
        ui.showSuccess('學生已移出', `${student.name} 已移出群組`)
    }
}
</script>
