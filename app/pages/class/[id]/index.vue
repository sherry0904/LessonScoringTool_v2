<template>
    <div v-if="classInfo" class="space-y-6">
        <!-- 操作面板 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="form-control flex-1">
                        <div class="flex items-center gap-4 justify-between w-full">
                            <div class="flex items-center gap-2">
                                <span class="label-text whitespace-nowrap">快速加分</span>
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
                            <div class="flex flex-wrap items-center gap-2 ml-auto">
                                <button
                                    class="btn btn-sm btn-outline"
                                    @click="selectAllStudents"
                                    type="button"
                                >
                                    全選
                                </button>
                                <button
                                    class="btn btn-sm btn-outline"
                                    @click="clearSelection"
                                    type="button"
                                >
                                    取消全選
                                </button>
                                <div class="divider divider-horizontal mx-1"></div>
                                <button
                                    class="btn btn-sm btn-outline"
                                    @click="exportClassScores"
                                    type="button"
                                >
                                    <LucideIcon name="Download" class="w-4 h-4 mr-1" />
                                    匯出成績
                                </button>
                                <button
                                    class="btn btn-sm btn-outline btn-warning"
                                    @click="resetClassScores"
                                    type="button"
                                >
                                    <LucideIcon name="RotateCcw" class="w-4 h-4 mr-1" />
                                    全班總分歸零
                                </button>
                                <button
                                    v-if="addStudent"
                                    class="btn btn-sm btn-primary"
                                    @click="addStudent"
                                    type="button"
                                >
                                    <LucideIcon name="UserPlus" class="w-4 h-4 mr-1" />
                                    新增學生
                                </button>
                            </div>
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
                    'card bg-base-100 border-2 border-base-300 shadow-md rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer',
                    { 'ring-2 ring-primary': selectedStudents.includes(student.id) },
                ]"
                @click="toggleStudentSelection(student.id)"
            >
                <div class="card-body p-0">
                    <div class="flex flex-row items-stretch divide-x divide-base-100">
                        <!-- 左欄：姓名、座號、出席 -->
                        <div class="flex flex-col justify-between p-4 flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-2">
                                <span
                                    class="inline-block w-2 h-2 rounded-full"
                                    :class="student.isPresent ? 'bg-green-500' : 'bg-gray-400'"
                                    :title="student.isPresent ? '出席' : '缺席'"
                                ></span>
                                <h3
                                    class="font-bold text-base md:text-lg lg:text-xl xl:text-2xl leading-tight truncate"
                                >
                                    {{ student.name }}
                                </h3>
                            </div>
                            <p class="text-sm text-base-content/70 mb-2">座號 {{ student.id }}</p>
                            <label class="flex items-center gap-2 select-none mt-2">
                                <input
                                    type="checkbox"
                                    :checked="student.isPresent"
                                    @click.stop
                                    @change.stop="togglePresence(student.id)"
                                    class="toggle toggle-success toggle-sm"
                                />
                                <span
                                    class="text-sm font-medium"
                                    :class="student.isPresent ? 'text-green-600' : 'text-gray-400'"
                                >
                                    {{ student.isPresent ? '出席' : '缺席' }}
                                </span>
                            </label>
                        </div>
                        <!-- 右欄：總分與按鈕 -->
                        <div
                            class="flex flex-col justify-center items-center bg-gradient-to-br from-base-200 via-base-100 to-base-300 rounded-r-2xl p-4 min-w-[80px] gap-2"
                        >
                            <div class="flex flex-col items-center">
                                <span class="text-xs text-base-content/60 mb-1">總分</span>
                                <span
                                    :class="[
                                        'font-extrabold text-xl md:text-2xl lg:text-3xl text-primary px-2 py-2',
                                        scoreAnimation[student.id],
                                    ]"
                                >
                                    {{ student.totalScore }}
                                </span>
                            </div>
                            <div class="flex gap-2 mt-2">
                                <button
                                    @click.stop="quickScore(student.id, 1)"
                                    class="btn btn-md font-bold text-base px-4 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white border-none shadow hover:scale-105 hover:from-green-500 hover:to-emerald-600"
                                    title="+1分"
                                >
                                    +1
                                </button>
                                <button
                                    @click.stop="quickScore(student.id, -1)"
                                    class="btn btn-md font-bold text-base px-4 py-1 rounded-full bg-gradient-to-r from-rose-400 to-red-500 text-white border-none shadow hover:scale-105 hover:from-rose-500 hover:to-red-600"
                                    title="-1分"
                                >
                                    -1
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="absolute top-3 right-3 z-10">
                    <div class="dropdown dropdown-end">
                        <div
                            tabindex="0"
                            role="button"
                            class="btn btn-ghost btn-xs btn-circle"
                            @click.stop
                        >
                            <LucideIcon name="MoreVertical" class="w-4 h-4" />
                        </div>
                        <ul
                            tabindex="0"
                            class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow"
                        >
                            <li>
                                <a
                                    v-if="editStudent"
                                    @click.stop="editStudent(student.id)"
                                    class="flex items-center gap-2"
                                >
                                    <LucideIcon name="Edit" class="w-3 h-3" />
                                    <span>編輯學生</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    @click.stop="viewStudentHistory(student)"
                                    class="flex items-center gap-2"
                                >
                                    <LucideIcon name="ScrollText" class="w-3 h-3" />
                                    <span>評分記錄</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    @click.stop="togglePresence(student.id)"
                                    class="flex items-center gap-2"
                                >
                                    <LucideIcon
                                        :name="student.isPresent ? 'UserMinus' : 'UserCheck'"
                                        class="w-3 h-3"
                                    />
                                    <span>{{ student.isPresent ? '標記缺席' : '標記出席' }}</span>
                                </a>
                            </li>
                            <div class="divider my-1"></div>
                            <li>
                                <a
                                    @click.stop="deleteStudent(student)"
                                    class="text-error flex items-center gap-2"
                                >
                                    <LucideIcon name="Trash2" class="w-3 h-3" />
                                    <span>刪除學生</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <dialog ref="historyModal" class="modal">
                <div class="modal-box w-11/12 max-w-2xl">
                    <h3 class="text-lg font-bold mb-4">{{ viewingStudent?.name }} 的評分記錄</h3>
                    <div
                        v-if="viewingStudent && viewingStudent.scores.length > 0"
                        class="space-y-3 max-h-96 overflow-y-auto"
                    >
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
    </div>
    <div v-else class="text-center p-8">
        <p>正在載入班級資料...</p>
        <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
</template>

<script setup lang="ts">
import { useClassesStore } from '~/stores/classes'
import { useUIStore } from '~/stores/ui'
import type { ClassInfo, Student } from '~/types'
import { storeToRefs } from 'pinia'
import { useExcelExport } from '~/composables/useExcelExport'

// 1. Get store and route
const classesStore = useClassesStore()
const ui = useUIStore()
const { exportToExcel } = useExcelExport()

// 2. Get classInfo from store using storeToRefs for reactivity
const { currentClass: classInfo } = storeToRefs(classesStore)

// 3. Inject functions from the parent layout
const addStudent = inject<() => void>('addStudent')
const editStudent = inject<(studentId: string) => void>('editStudent')

// Modal refs
const historyModal = ref<HTMLDialogElement>()

// State
const selectedScore = ref<number | null>(1)
const selectedStudents = ref<string[]>([])
const viewingStudent = ref<Student | null>(null)

// 分數動畫狀態
const scoreAnimation = ref<Record<string, string | null>>({})

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

const selectAllStudents = () => {
    if (!classInfo.value) return
    selectedStudents.value = classInfo.value.students.map((s) => s.id)
}

const clearSelection = () => {
    selectedStudents.value = []
}

const quickScore = (studentId: string, score: number) => {
    addScoreToStudent(studentId, score, '快速評分')
    scoreAnimation.value[studentId] =
        score > 0 ? 'animate-score-bounce-green' : 'animate-score-bounce-red'
    setTimeout(() => {
        scoreAnimation.value[studentId] = null
    }, 500)
}

const applyQuickScore = (score: number) => {
    if (selectedStudents.value.length > 0) {
        selectedStudents.value.forEach((id) => addScoreToStudent(id, score, '批量快速評分'))
        clearSelection() // Clear selection after applying score
    } else {
        selectedScore.value = score
    }
}

const addScoreToStudent = (studentId: string, score: number, reason: string) => {
    if (!classInfo.value) return
    classesStore.addScoreToStudent(classInfo.value.id, studentId, score, reason)
}

const deleteStudent = (student: Student) => {
    if (!classInfo.value) return
    if (confirm(`確定要刪除學生「${student.name}」嗎？此操作無法復原。`)) {
        classesStore.removeStudentFromClass(classInfo.value.id, student.id)
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
    if (!classInfo.value) return
    const student = classInfo.value.students.find((s) => s.id === studentId)
    if (student) {
        classesStore.updateStudent(classInfo.value.id, studentId, { isPresent: !student.isPresent })
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

const exportClassScores = () => {
    if (!classInfo.value) return

    const today = new Date()
    const dateString = today.toISOString().split('T')[0]

    const data = classInfo.value.students.map((student) => ({
        座號: student.id,
        姓名: student.name,
        總分: student.totalScore,
        出席: student.isPresent ? '是' : '否',
    }))

    const sheetData = {
        sheetName: `${classInfo.value.name} - 成績單`,
        header: [[`班級:`, classInfo.value.name], [`匯出日期:`, today.toLocaleString('zh-TW')], []],
        data: data,
        columnWidths: [{ wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 10 }],
    }

    const fileName = `${dateString}-${classInfo.value.name}-成績單`
    exportToExcel([sheetData], fileName)
}

const resetClassScores = () => {
    if (!classInfo.value) return
    const confirmed = confirm(
        `將會把「${classInfo.value.name}」全體學生的總分歸零並清除評分紀錄，確定要執行嗎？`,
    )
    if (!confirmed) return

    const success = classesStore.resetClassTotals(classInfo.value.id)
    if (success) {
        ui.showSuccess('已重置全班總分')
        scoreAnimation.value = {}
    }
}
</script>

<style scoped>
@import '@/assets/score-animate.css';
</style>
