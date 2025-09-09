<template>
    <div class="space-y-6">
        <!-- 操作面板 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">評分類別</span>
                        </label>
                        <select v-model="selectedCategory" class="select select-bordered">
                            <option
                                v-for="category in scoreCategories"
                                :key="category.id"
                                :value="category.id"
                            >
                                {{ category.name }}
                            </option>
                        </select>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">評分原因</span>
                        </label>
                        <input
                            v-model="scoreReason"
                            type="text"
                            placeholder="選填：記錄評分原因"
                            class="input input-bordered"
                        />
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">快速加分</span>
                        </label>
                        <div class="btn-group">
                            <button
                                v-for="score in quickScores"
                                :key="score"
                                :class="['btn btn-sm', score > 0 ? 'btn-success' : 'btn-error']"
                                @click="selectedScore = score"
                            >
                                {{ score > 0 ? '+' : '' }}{{ score }}
                            </button>
                        </div>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">自訂分數</span>
                        </label>
                        <input
                            v-model.number="selectedScore"
                            type="number"
                            placeholder="分數"
                            class="input input-bordered w-20"
                            min="-10"
                            max="10"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 學生列表 -->
        <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-base-content/70">總分</span>
                            <span class="font-bold text-lg text-primary">
                                {{ student.totalScore }}
                            </span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-base-content/70">平均</span>
                            <span class="text-sm">
                                {{ student.averageScore.toFixed(1) }}
                            </span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-base-content/70">記錄數</span>
                            <span class="text-sm">
                                {{ student.scores.length }}
                            </span>
                        </div>
                    </div>

                    <!-- 出席狀態 -->
                    <div class="flex justify-between items-center">
                        <div
                            :class="[
                                'badge badge-sm',
                                student.isPresent ? 'badge-success' : 'badge-error',
                            ]"
                        >
                            {{ student.isPresent ? '出席' : '缺席' }}
                        </div>

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

        <!-- 批量操作面板 -->
        <div
            v-if="selectedStudents.length > 0"
            class="fixed bottom-6 left-1/2 transform -translate-x-1/2"
        >
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body p-4">
                    <div class="flex items-center gap-4">
                        <span class="text-sm"> 已選擇 {{ selectedStudents.length }} 位學生 </span>
                        <button
                            @click="batchScore"
                            class="btn btn-primary btn-sm"
                            :disabled="!selectedScore"
                        >
                            批量評分 {{ selectedScore > 0 ? '+' : '' }}{{ selectedScore }}
                        </button>
                        <button @click="clearSelection" class="btn btn-ghost btn-sm">
                            取消選擇
                        </button>
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
                                <span class="font-medium">{{ score.categoryName }}</span>
                            </div>
                            <p v-if="score.reason" class="text-sm text-base-content/70 mt-1">
                                {{ score.reason }}
                            </p>
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

// Modal refs
const historyModal = ref<HTMLDialogElement>()

// State
const selectedCategory = ref('participation')
const scoreReason = ref('')
const selectedScore = ref(1)
const selectedStudents = ref<string[]>([])
const viewingStudent = ref<Student | null>(null)

const quickScores = [3, 2, 1, -1, -2, -3]

const scoreCategories = [
    { id: 'participation', name: '參與度' },
    { id: 'homework', name: '作業' },
    { id: 'behavior', name: '行為表現' },
    { id: 'creativity', name: '創意思考' },
]

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
    addScoreToStudent(studentId, score, selectedCategory.value, scoreReason.value)
}

const batchScore = () => {
    if (!selectedScore.value) return

    selectedStudents.value.forEach((studentId) => {
        addScoreToStudent(studentId, selectedScore.value, selectedCategory.value, scoreReason.value)
    })

    clearSelection()
    scoreReason.value = ''
}

const addScoreToStudent = (
    studentId: string,
    score: number,
    categoryId: string,
    reason: string,
) => {
    const student = props.classInfo.students.find((s) => s.id === studentId)
    if (!student) return

    const category = scoreCategories.find((c) => c.id === categoryId)
    if (!category) return

    const newScore = {
        id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        value: score,
        categoryId,
        categoryName: category.name,
        reason: reason || '',
        timestamp: new Date(),
    }

    student.scores.push(newScore)
    updateStudentStats(student)
    classesStore.saveToStorage()
}

const updateStudentStats = (student: Student) => {
    const scores = student.scores.map((s) => s.value)
    student.totalScore = scores.reduce((sum, score) => sum + score, 0)
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
