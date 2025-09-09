<template>
    <div class="space-y-6">
        <!-- 頂部操作列 -->
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <h1 class="text-2xl font-bold text-base-content">學生管理</h1>
                <div class="badge badge-primary">{{ classStore.students.length }} 位學生</div>
            </div>

            <div class="flex items-center space-x-3">
                <!-- 檢視模式切換 -->
                <div class="btn-group">
                    <button
                        @click="ui.setViewMode('grid')"
                        :class="['btn btn-sm', ui.viewMode === 'grid' ? 'btn-active' : '']"
                    >
                        <LucideIcon name="Grid3X3" class="w-4 h-4" />
                    </button>
                    <button
                        @click="ui.setViewMode('list')"
                        :class="['btn btn-sm', ui.viewMode === 'list' ? 'btn-active' : '']"
                    >
                        <LucideIcon name="List" class="w-4 h-4" />
                    </button>
                </div>

                <!-- 新增學生按鈕 -->
                <button @click="openAddStudentModal" class="btn btn-primary">
                    <LucideIcon name="UserPlus" class="w-4 h-4 mr-2" />
                    新增學生
                </button>
            </div>
        </div>

        <!-- 搜尋和篩選 -->
        <div class="glass-card p-4 rounded-xl">
            <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-1">
                    <div class="relative">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="搜尋學生姓名或座號..."
                            class="input input-bordered w-full pl-10"
                        />
                        <LucideIcon
                            name="Search"
                            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50"
                        />
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <!-- 出席狀態篩選 -->
                    <select v-model="attendanceFilter" class="select select-bordered">
                        <option value="all">全部學生</option>
                        <option value="present">出席學生</option>
                        <option value="absent">缺席學生</option>
                    </select>

                    <!-- 排序 -->
                    <select v-model="sortBy" class="select select-bordered">
                        <option value="name">按姓名排序</option>
                        <option value="number">按座號排序</option>
                        <option value="score">按成績排序</option>
                        <option value="group">按分組排序</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- 學生列表 -->
        <div v-if="filteredStudents.length === 0" class="glass-card p-8 rounded-xl text-center">
            <LucideIcon name="Users" class="w-16 h-16 text-base-content/30 mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-base-content mb-2">
                {{ classStore.students.length === 0 ? '還沒有學生' : '沒有符合條件的學生' }}
            </h3>
            <p class="text-base-content/60 mb-4">
                {{
                    classStore.students.length === 0
                        ? '開始新增學生來管理您的課堂'
                        : '請調整搜尋條件或篩選設定'
                }}
            </p>
            <button
                v-if="classStore.students.length === 0"
                @click="openAddStudentModal"
                class="btn btn-primary"
            >
                新增第一位學生
            </button>
        </div>

        <!-- Grid 檢視 -->
        <div
            v-else-if="ui.viewMode === 'grid'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            <StudentCard
                v-for="student in filteredStudents"
                :key="student.id"
                :student="student"
                @score="openScoreModal"
                @edit="openEditStudentModal"
                @delete="deleteStudent"
                @toggle-attendance="toggleAttendance"
            />
        </div>

        <!-- List 檢視 -->
        <div v-else class="glass-card rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>
                                <label>
                                    <input
                                        type="checkbox"
                                        class="checkbox"
                                        :checked="isAllSelected"
                                        @change="toggleSelectAll"
                                    />
                                </label>
                            </th>
                            <th>學生</th>
                            <th>座號</th>
                            <th>出席狀態</th>
                            <th>分組</th>
                            <th>平均分數</th>
                            <th>評分次數</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="student in filteredStudents"
                            :key="student.id"
                            :class="{ 'opacity-50': !student.isPresent }"
                        >
                            <th>
                                <label>
                                    <input
                                        type="checkbox"
                                        class="checkbox"
                                        :checked="ui.selectedStudents.includes(student.id)"
                                        @change="ui.toggleStudentSelection(student.id)"
                                    />
                                </label>
                            </th>
                            <td>
                                <div class="flex items-center space-x-3">
                                    <div class="avatar placeholder">
                                        <div
                                            class="bg-primary text-primary-content rounded-full w-10"
                                        >
                                            <span class="text-sm">{{
                                                student.name.charAt(0)
                                            }}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="font-bold">{{ student.name }}</div>
                                        <div class="text-sm opacity-50">
                                            建立於 {{ formatDate(student.createdAt) }}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="badge badge-ghost">{{ student.number }}</div>
                            </td>
                            <td>
                                <div
                                    :class="[
                                        'badge',
                                        student.isPresent ? 'badge-success' : 'badge-error',
                                    ]"
                                >
                                    {{ student.isPresent ? '出席' : '缺席' }}
                                </div>
                            </td>
                            <td>
                                <div v-if="student.group" class="badge badge-outline">
                                    {{ student.group }}
                                </div>
                                <span v-else class="text-base-content/50">未分組</span>
                            </td>
                            <td>
                                <div class="font-semibold">
                                    {{ getStudentAverageScore(student) }}
                                </div>
                            </td>
                            <td>
                                <div class="text-center">
                                    {{ student.scores.length }}
                                </div>
                            </td>
                            <td>
                                <div class="flex items-center space-x-1">
                                    <button
                                        @click="openScoreModal(student)"
                                        class="btn btn-ghost btn-xs"
                                        title="評分"
                                    >
                                        <LucideIcon name="Star" class="w-4 h-4" />
                                    </button>
                                    <button
                                        @click="toggleAttendance(student.id)"
                                        class="btn btn-ghost btn-xs"
                                        :title="student.isPresent ? '標記缺席' : '標記出席'"
                                    >
                                        <LucideIcon
                                            :name="student.isPresent ? 'UserX' : 'UserCheck'"
                                            class="w-4 h-4"
                                        />
                                    </button>
                                    <button
                                        @click="openEditStudentModal(student)"
                                        class="btn btn-ghost btn-xs"
                                        title="編輯"
                                    >
                                        <LucideIcon name="Edit" class="w-4 h-4" />
                                    </button>
                                    <button
                                        @click="deleteStudent(student.id)"
                                        class="btn btn-ghost btn-xs text-error"
                                        title="刪除"
                                    >
                                        <LucideIcon name="Trash2" class="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 批次操作 -->
        <div
            v-if="ui.selectedStudents.length > 0"
            class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30"
        >
            <div class="glass-card p-4 rounded-full shadow-lg">
                <div class="flex items-center space-x-4">
                    <span class="text-sm font-medium">
                        已選擇 {{ ui.selectedStudents.length }} 位學生
                    </span>
                    <div class="flex items-center space-x-2">
                        <button @click="batchToggleAttendance" class="btn btn-sm btn-primary">
                            <LucideIcon name="Users" class="w-4 h-4 mr-1" />
                            批次出席
                        </button>
                        <button @click="batchScore" class="btn btn-sm btn-secondary">
                            <LucideIcon name="Star" class="w-4 h-4 mr-1" />
                            批次評分
                        </button>
                        <button @click="ui.clearStudentSelection()" class="btn btn-sm btn-ghost">
                            取消選擇
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

                <div class="form-control">
                    <label class="cursor-pointer label justify-start space-x-3">
                        <input
                            v-model="studentForm.isPresent"
                            type="checkbox"
                            class="checkbox checkbox-primary"
                        />
                        <span class="label-text">出席狀態</span>
                    </label>
                </div>

                <div class="modal-action">
                    <button type="button" @click="closeStudentModal" class="btn btn-ghost">
                        取消
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        :disabled="!studentForm.name || !studentForm.number"
                    >
                        {{ editingStudent ? '更新' : '新增' }}
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" @click="closeStudentModal"></div>
    </div>

    <!-- 評分 Modal -->
    <div v-if="showScoreModal" class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">為 {{ scoringStudent?.name }} 評分</h3>

            <form @submit.prevent="saveScore" class="space-y-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">評分類別</span>
                    </label>
                    <select v-model="scoreForm.category" class="select select-bordered" required>
                        <option value="">請選擇評分類別</option>
                        <option
                            v-for="category in classStore.settings.scoreCategories"
                            :key="category.id"
                            :value="category.id"
                        >
                            {{ category.name }}
                        </option>
                    </select>
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text"
                            >分數 ({{ classStore.settings.minScore }} -
                            {{ classStore.settings.maxScore }})</span
                        >
                    </label>
                    <input
                        v-model.number="scoreForm.score"
                        type="number"
                        :min="classStore.settings.minScore"
                        :max="classStore.settings.maxScore"
                        class="input input-bordered"
                        required
                    />
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">備註</span>
                    </label>
                    <textarea
                        v-model="scoreForm.note"
                        class="textarea textarea-bordered"
                        placeholder="選填：評分說明或備註"
                        rows="3"
                    ></textarea>
                </div>

                <div class="modal-action">
                    <button type="button" @click="closeScoreModal" class="btn btn-ghost">
                        取消
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        :disabled="!scoreForm.category || scoreForm.score === null"
                    >
                        確認評分
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" @click="closeScoreModal"></div>
    </div>
</template>

<script setup lang="ts">
import type { Student } from '~/types'

const classStore = useClassStore()
const ui = useUIStore()

// 狀態
const searchQuery = ref('')
const attendanceFilter = ref('all')
const sortBy = ref('name')
const showStudentModal = ref(false)
const showScoreModal = ref(false)
const editingStudent = ref<Student | null>(null)
const scoringStudent = ref<Student | null>(null)

// 表單
const studentForm = ref({
    name: '',
    number: '',
    isPresent: true,
})

const scoreForm = ref({
    category: '',
    score: null as number | null,
    note: '',
})

// 計算屬性
const filteredStudents = computed(() => {
    let students = [...classStore.students]

    // 搜尋篩選
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        students = students.filter(
            (student) =>
                student.name.toLowerCase().includes(query) ||
                student.number.toLowerCase().includes(query),
        )
    }

    // 出席狀態篩選
    if (attendanceFilter.value !== 'all') {
        students = students.filter((student) =>
            attendanceFilter.value === 'present' ? student.isPresent : !student.isPresent,
        )
    }

    // 排序
    students.sort((a, b) => {
        switch (sortBy.value) {
            case 'number':
                return a.number.localeCompare(b.number, 'zh-TW', { numeric: true })
            case 'score':
                return getStudentAverageScore(b) - getStudentAverageScore(a)
            case 'group':
                return (a.group || '').localeCompare(b.group || '')
            default: // name
                return a.name.localeCompare(b.name)
        }
    })

    return students
})

const isAllSelected = computed(() => {
    return (
        filteredStudents.value.length > 0 &&
        filteredStudents.value.every((student) => ui.selectedStudents.includes(student.id))
    )
})

// 方法
const getStudentAverageScore = (student: Student) => {
    if (student.scores.length === 0) return '0.0'
    const average =
        student.scores.reduce((sum, score) => sum + score.score, 0) / student.scores.length
    return average.toFixed(1)
}

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        ui.clearStudentSelection()
    } else {
        ui.selectAllStudents(filteredStudents.value.map((s) => s.id))
    }
}

const toggleAttendance = (studentId: string) => {
    const student = classStore.students.find((s) => s.id === studentId)
    if (student) {
        classStore.updateStudent(studentId, { isPresent: !student.isPresent })
        ui.showSuccess(
            '出席狀態已更新',
            `${student.name} 已標記為${!student.isPresent ? '出席' : '缺席'}`,
        )
    }
}

const deleteStudent = (studentId: string) => {
    const student = classStore.students.find((s) => s.id === studentId)
    if (student && confirm(`確定要刪除學生「${student.name}」嗎？此操作無法復原。`)) {
        classStore.removeStudent(studentId)
        ui.showSuccess('學生已刪除', `${student.name} 已從名單中移除`)
    }
}

// Modal 操作
const openAddStudentModal = () => {
    editingStudent.value = null
    studentForm.value = {
        name: '',
        number: '',
        isPresent: true,
    }
    showStudentModal.value = true
}

const openEditStudentModal = (student: Student) => {
    editingStudent.value = student
    studentForm.value = {
        name: student.name,
        number: student.number,
        isPresent: student.isPresent,
    }
    showStudentModal.value = true
}

const closeStudentModal = () => {
    showStudentModal.value = false
    editingStudent.value = null
}

const saveStudent = () => {
    if (editingStudent.value) {
        classStore.updateStudent(editingStudent.value.id, studentForm.value)
        ui.showSuccess('學生資料已更新', `${studentForm.value.name} 的資料已儲存`)
    } else {
        classStore.addStudent(studentForm.value)
        ui.showSuccess('學生已新增', `${studentForm.value.name} 已加入名單`)
    }

    closeStudentModal()
}

const openScoreModal = (student: Student) => {
    scoringStudent.value = student
    scoreForm.value = {
        category: '',
        score: null,
        note: '',
    }
    showScoreModal.value = true
}

const closeScoreModal = () => {
    showScoreModal.value = false
    scoringStudent.value = null
}

const saveScore = () => {
    if (scoringStudent.value && scoreForm.value.category && scoreForm.value.score !== null) {
        classStore.addScore(scoringStudent.value.id, {
            score: scoreForm.value.score,
            category: scoreForm.value.category,
            note: scoreForm.value.note,
        })

        ui.showSuccess('評分完成', `${scoringStudent.value.name} 獲得 ${scoreForm.value.score} 分`)

        closeScoreModal()
    }
}

// 批次操作
const batchToggleAttendance = () => {
    ui.selectedStudents.forEach((studentId) => {
        const student = classStore.students.find((s) => s.id === studentId)
        if (student) {
            classStore.updateStudent(studentId, { isPresent: !student.isPresent })
        }
    })

    ui.showSuccess('批次更新完成', `已更新 ${ui.selectedStudents.length} 位學生的出席狀態`)
    ui.clearStudentSelection()
}

const batchScore = () => {
    // 這裡可以開啟批次評分的 modal
    ui.showInfo('批次評分', '批次評分功能開發中...')
}

const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('zh-TW').format(new Date(date))
}
</script>
