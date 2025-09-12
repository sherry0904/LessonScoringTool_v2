<template>
    <div class="space-y-6">
        <!-- 操作面板 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">快速加分</span>
                        </label>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="score in quickScores"
                                :key="score"
                                @click="applyQuickScore(score)"
                                :class="[
                                    'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-primary/40',
                                    score === selectedScore
                                        ? score > 0
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow'
                                            : 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow'
                                        : score > 0
                                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40'
                                          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40',
                                ]"
                                :title="
                                    selectedStudents.length
                                        ? '立即對選取學生套用'
                                        : '設定批量評分預設分數'
                                "
                            >
                                {{ score > 0 ? '+' : '' }}{{ score }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 學生列表 -->
        <div
            class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-all"
            :class="selectedStudents.length ? 'pb-32' : ''"
        >
            <div
                v-for="student in classInfo.students"
                :key="student.id"
                :class="[
                    'card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',
                    { 'ring-2 ring-primary': selectedStudents.includes(student.id) },
                ]"
                @click="toggleStudentSelection(student.id)"
            >
                <div class="card-body p-4">
                    <!-- 學生信息 -->
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="font-semibold text-base">{{ student.name }}</h3>
                            <p class="text-sm text-base-content/70">座號 {{ student.id }}</p>
                        </div>
                        <div class="dropdown dropdown-end">
                            <div
                                tabindex="0"
                                role="button"
                                class="btn btn-ghost btn-xs btn-circle"
                                @click.stop
                            >
                                <LucideIcon name="MoreVertical" class="w-3 h-3" />
                            </div>
                            <ul
                                tabindex="0"
                                class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow"
                            >
                                <li>
                                    <a @click.stop="openEditStudentModal(student)">
                                        <LucideIcon name="Edit" class="w-3 h-3" />
                                        編輯學生
                                    </a>
                                </li>
                                <li>
                                    <a @click.stop="viewStudentHistory(student)">
                                        <LucideIcon name="ScrollText" class="w-3 h-3" />
                                        評分記錄
                                    </a>
                                </li>
                                <li>
                                    <a @click.stop="togglePresence(student.id)">
                                        <LucideIcon
                                            :name="student.isPresent ? 'UserMinus' : 'UserCheck'"
                                            class="w-3 h-3"
                                        />
                                        {{ student.isPresent ? '標記缺席' : '標記出席' }}
                                    </a>
                                </li>
                                <div class="divider my-1"></div>
                                <li>
                                    <a @click.stop="deleteStudent(student)" class="text-error">
                                        <LucideIcon name="Trash2" class="w-3 h-3" />
                                        刪除學生
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- 分數統計 -->
                    <div class="space-y-2 mb-3">
                        <div class="flex justify-between items-center group">
                            <span class="text-sm text-base-content/70 flex items-center gap-1"
                                >總分</span
                            >
                            <span class="font-bold text-lg text-primary">
                                {{ student.totalScore }}
                            </span>
                        </div>
                        <div
                            class="flex justify-between items-center"
                            title="平均 = 總分 / 記錄次數 (四捨五入到 0.1)"
                        >
                            <span class="text-sm text-base-content/70">平均</span>
                            <span class="text-sm">{{ student.averageScore.toFixed(1) }}</span>
                        </div>
                    </div>

                    <!-- 出席狀態 -->
                    <div class="flex justify-between items-center">
                        <label class="flex items-center gap-2 select-none">
                            <input
                                type="checkbox"
                                :checked="student.isPresent"
                                @change.stop="togglePresence(student.id)"
                                class="toggle toggle-success toggle-sm"
                            />
                            <span
                                class="text-xs font-medium"
                                :class="student.isPresent ? 'text-green-600' : 'text-gray-400'"
                            >
                                {{ student.isPresent ? '出席' : '缺席' }}
                            </span>
                        </label>

                        <!-- 快速評分按鈕 -->
                        <div class="flex gap-1">
                            <button
                                @click.stop="quickScore(student.id, 1)"
                                class="btn btn-xs btn-success"
                                title="+1分"
                            >
                                +1
                            </button>
                            <button
                                @click.stop="quickScore(student.id, -1)"
                                class="btn btn-xs btn-error"
                                title="-1分"
                            >
                                -1
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 新增/編輯學生 Modal -->
        <div v-if="showStudentModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">
                    {{ editingStudent ? '編輯學生' : '新增學生' }}
                </h3>
                <form @submit.prevent="saveStudent" class="space-y-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">姓名 *</span>
                        </label>
                        <input
                            v-model="studentForm.name"
                            type="text"
                            placeholder="請輸入學生姓名"
                            class="input input-bordered"
                            required
                        />
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">座號 *</span>
                        </label>
                        <input
                            v-model="studentForm.number"
                            type="text"
                            placeholder="請輸入座號"
                            class="input input-bordered"
                            required
                        />
                    </div>
                    <div class="modal-action">
                        <button type="button" @click="closeStudentModal" class="btn btn-ghost">取消</button>
                        <button type="submit" class="btn btn-primary">{{ editingStudent ? '更新' : '新增' }}</button>
                    </div>
                </form>
            </div>
            <div class="modal-backdrop" @click="closeStudentModal"></div>
        </div>

        <!-- 學生評分記錄模態 -->
        <dialog ref="historyModal" class="modal">
            <div class="modal-box w-11/12 max-w-2xl">
                <h3 class="text-lg font-bold mb-4">{{ viewingStudent?.name }} 的評分記錄</h3>
                <div v-if="viewingStudent && viewingStudent.scores.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
                    <div
                        v-for="score in viewingStudent.scores.slice().reverse()"
                        :key="score.id"
                        class="flex justify-between items-center p-3 bg-base-200 rounded-lg"
                    >
                        <div>
                            <div class="flex items-center gap-2">
                                <span
                                    :class="[
                                        'badge',
                                        score.value > 0 ? 'badge-success' : 'badge-error',
                                    ]"
                                >
                                    {{ score.value > 0 ? '+' : '' }}{{ score.value }}
                                </span>
                                <span class="text-sm">{{ score.reason || '快速評分' }}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm text-base-content/70">
                                {{ formatDateTime(score.timestamp) }}
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-8 text-base-content/70">尚無評分記錄</div>
                <div class="modal-action">
                    <button @click="closeHistoryModal" class="btn btn-ghost">關閉</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeHistoryModal">close</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import type { ClassInfo, Student } from '~/types'

interface Props {
    classInfo: ClassInfo
}

const props = defineProps<Props>()
const classesStore = useClassesStore()
const ui = useUIStore()

// Modal refs
const historyModal = ref<HTMLDialogElement>()
const showStudentModal = ref(false)

// State
const selectedScore = ref<number | null>(1)
const selectedStudents = ref<string[]>([])
const viewingStudent = ref<Student | null>(null)
const editingStudent = ref<Student | null>(null)
const studentForm = ref({ id: '', name: '', number: '' })

const quickScores = [3, 2, 1, -1, -2, -3]

// Methods
const toggleStudentSelection = (studentId: string) => {
    const index = selectedStudents.value.indexOf(studentId)
    if (index > -1) {
        selectedStudents.value.splice(index, 1)
    } else {
        selectedStudents.value.push(studentId)
    }
}

const clearSelection = () => {
    selectedStudents.value = []
}

const quickScore = (studentId: string, score: number) => {
    addScoreToStudent(studentId, score, '快速評分')
}

const applyQuickScore = (score: number) => {
    if (selectedStudents.value.length > 0) {
        selectedStudents.value.forEach((id) => addScoreToStudent(id, score, '批量快速評分'))
    } else {
        selectedScore.value = score
    }
}

const addScoreToStudent = (studentId: string, score: number, reason: string) => {
    classesStore.addScoreToStudent(props.classInfo.id, studentId, score, reason)
}

const openEditStudentModal = (student: Student) => {
    editingStudent.value = student
    studentForm.value = { id: student.id, name: student.name, number: String(student.id) } // Assuming student.id is the number
    showStudentModal.value = true
}

const closeStudentModal = () => {
    showStudentModal.value = false
    editingStudent.value = null
}

const saveStudent = () => {
    if (editingStudent.value) {
        classesStore.updateStudent(props.classInfo.id, editingStudent.value.id, {
            name: studentForm.value.name,
            // number: studentForm.value.number, // The student ID (number) is not editable in this structure
        })
        ui.showSuccess('學生已更新')
    }
    closeStudentModal()
}

const deleteStudent = (student: Student) => {
    if (confirm(`確定要刪除學生「${student.name}」嗎？此操作無法復原。`)) {
        classesStore.removeStudentFromClass(props.classInfo.id, student.id)
        ui.showSuccess('學生已刪除')
    }
}

const viewStudentHistory = (student: Student) => {
    viewingStudent.value = student
    historyModal.value?.showModal()
}

const closeHistoryModal = () => {
    historyModal.value?.close()
    viewingStudent.value = null
}

const togglePresence = (studentId: string) => {
    const student = props.classInfo.students.find((s) => s.id === studentId)
    if (student) {
        classesStore.updateStudent(props.classInfo.id, studentId, { isPresent: !student.isPresent })
    }
}

const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
</script>