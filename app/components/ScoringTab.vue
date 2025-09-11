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
                                    <a @click.stop="editStudent(student.id)">
                                        <LucideIcon name="Edit" class="w-3 h-3" />
                                        編輯學生
                                    </a>
                                </li>
                                <li>
                                    <a @click.stop="viewStudentHistory(student.id)">
                                        <LucideIcon name="History" class="w-3 h-3" />
                                        評分記錄
                                    </a>
                                </li>
                                <li>
                                    <a @click.stop="togglePresence(student.id)">
                                        <LucideIcon
                                            :name="student.isPresent ? 'UserX' : 'UserCheck'"
                                            class="w-3 h-3"
                                        />
                                        {{ student.isPresent ? '標記缺席' : '標記出席' }}
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
                        <!-- 記錄數暫時隱藏 -->
                    </div>

                    <!-- 出席狀態 -->
                    <div class="flex justify-between items-center">
                        <label class="flex items-center gap-2 select-none">
                            <input
                                type="checkbox"
                                :checked="student.isPresent"
                                @change.stop="togglePresence(student.id)"
                                class="toggle toggle-success toggle-sm"
                                :aria-checked="student.isPresent ? 'true' : 'false'"
                                :aria-label="student.isPresent ? '標記缺席' : '標記出席'"
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

        <!-- 學生評分記錄模態 -->
        <dialog ref="historyModal" class="modal">
            <div class="modal-box w-11/12 max-w-2xl">
                <h3 class="text-lg font-bold mb-4">{{ viewingStudent?.name }} 的評分記錄</h3>

                <div v-if="viewingStudent" class="space-y-3 max-h-96 overflow-y-auto">
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
        </dialog>
        <!-- 補上缺失的結尾 div -->
        <form method="dialog" class="modal-backdrop">
            <button @click="closeHistoryModal">close</button>
        </form>
    </div>
</template>

<script setup lang="ts">
import type { ClassInfo, Student } from '~/types'

interface Props {
    classInfo: ClassInfo
}

const props = defineProps<Props>()
const classesStore = useClassesStore()

// Modal refs
const historyModal = ref<HTMLDialogElement>()

// State
const selectedScore = ref<number | null>(1)
const selectedStudents = ref<string[]>([])
const viewingStudent = ref<Student | null>(null)

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
    // 單人卡片快速加分
    addScoreToStudent(studentId, score)
}

// 上方面板快速加分按鈕邏輯：若已選學生，直接批量套用；否則僅設定選擇分數供底部批量面板使用
const applyQuickScore = (score: number) => {
    if (selectedStudents.value.length > 0) {
        selectedStudents.value.forEach((id) => addScoreToStudent(id, score))
    } else {
        selectedScore.value = score
    }
}

const batchScore = () => {
    if (selectedStudents.value.length === 0 || selectedScore.value === null) return
    selectedStudents.value.forEach((studentId) =>
        addScoreToStudent(studentId, selectedScore.value as number),
    )
    clearSelection()
}

const addScoreToStudent = (studentId: string, score: number) => {
    const student = props.classInfo.students.find((s) => s.id === studentId)
    if (!student) return

    const newScore = {
        id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        value: score,
        timestamp: new Date(),
    }

    student.scores.push(newScore)
    updateStudentStats(student)
    classesStore.saveToStorage()
}

const updateStudentStats = (student: Student) => {
    const scores = student.scores.map((s) => s.value)
    student.totalScore = scores.reduce((sum, score) => sum + score, 0)
    // 平均 = 總分 / 記錄次數（若無記錄則為 0）
    student.averageScore = scores.length > 0 ? student.totalScore / scores.length : 0
}

const editStudent = (studentId: string) => {
    const editStudentFn = inject('editStudent') as Function
    if (editStudentFn) {
        editStudentFn(studentId)
    }
}

const viewStudentHistory = (studentId: string) => {
    viewingStudent.value = props.classInfo.students.find((s) => s.id === studentId) || null
    historyModal.value?.showModal()
}

const closeHistoryModal = () => {
    historyModal.value?.close()
    viewingStudent.value = null
}

const togglePresence = (studentId: string) => {
    classesStore.updateStudent(props.classInfo.id, studentId, {
        isPresent: !props.classInfo.students.find((s) => s.id === studentId)?.isPresent,
    })
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
