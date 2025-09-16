<template>
    <div v-if="classInfo" class="space-y-6">
        <!-- 作業管理面板 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex justify-between items-center">
                    <h3 class="card-title">作業管理</h3>
                    <button @click="showHomeworkModalForAdd" class="btn btn-primary gap-2">
                        <LucideIcon name="Plus" class="w-4 h-4" />
                        新增作業
                    </button>
                </div>

                <!-- 作業列表 -->
                <div v-if="classInfo.homeworks.length > 0" class="mt-4">
                    <div class="tabs tabs-boxed">
                        <button
                            v-for="homework in classInfo.homeworks"
                            :key="homework.id"
                            :class="['tab', { 'tab-active': selectedHomework === homework.id }]"
                            @click="selectedHomework = homework.id"
                        >
                            {{ homework.title }}
                        </button>
                    </div>
                </div>

                <div v-else class="text-center py-8 text-base-content/70">
                    還沒有作業，點擊上方按鈕新增第一個作業
                </div>
            </div>
        </div>

        <!-- 當前作業標題與編輯 -->
        <div v-if="currentHomework" class="flex items-center gap-2 mb-4">
            <h2 class="text-2xl font-bold">{{ currentHomework.title }}</h2>
            <button
                @click="showHomeworkModalForEdit(currentHomework.id)"
                class="btn btn-ghost btn-sm btn-circle"
                title="編輯作業名稱"
            >
                <LucideIcon name="Edit" class="w-4 h-4" />
            </button>
        </div>

        <!-- 作業狀態檢視 -->
        <div v-if="currentHomework" class="space-y-4">
            <!-- 統計概覽 -->
            <div class="stats stats-horizontal shadow">
                <div class="stat">
                    <div class="stat-title">未繳交</div>
                    <div class="stat-value text-error">{{ getStatusCount('pending') }}</div>
                </div>
                <div class="stat">
                    <div class="stat-title">已繳交</div>
                    <div class="stat-value text-success">{{ getStatusCount('submitted') }}</div>
                </div>
                <div class="stat">
                    <div class="stat-title">待訂正</div>
                    <div class="stat-value text-warning">
                        {{ getStatusCount('needs_correction') }}
                    </div>
                </div>
                <div class="stat">
                    <div class="stat-title">已完成</div>
                    <div class="stat-value text-info">{{ getStatusCount('completed') }}</div>
                </div>
            </div>

            <!-- 快速操作 -->
            <div class="card bg-base-100 shadow-sm">
                <div class="card-body">
                    <div class="flex flex-wrap gap-4 items-center">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">快速操作</span>
                            </label>
                            <div class="btn-group">
                                <button
                                    @click="batchUpdateStatus('submitted')"
                                    class="btn btn-success btn-sm mr-2"
                                    :disabled="selectedStudents.length === 0"
                                >
                                    批量標記已繳交
                                </button>
                                <button
                                    @click="batchUpdateStatus('needs_correction')"
                                    class="btn btn-warning btn-sm mr-2"
                                    :disabled="selectedStudents.length === 0"
                                >
                                    批量標記待訂正
                                </button>
                                <button
                                    @click="batchUpdateStatus('completed')"
                                    class="btn btn-info btn-sm"
                                    :disabled="selectedStudents.length === 0"
                                >
                                    批量標記已完成
                                </button>
                            </div>
                        </div>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">匯出功能</span>
                            </label>
                            <div class="btn-group">
                                <button
                                    @click="exportIncompleteList"
                                    class="btn btn-outline btn-sm"
                                >
                                    匯出未完成名單
                                </button>
                                <button @click="exportStatusReport" class="btn btn-outline btn-sm">
                                    匯出狀態報告
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 學生狀態列表 -->
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
                                        <a @click.stop="exportStudentReport(student.id)">
                                            <LucideIcon name="FileText" class="w-3 h-3" />
                                            個人報告
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <!-- 作業狀態 -->
                        <div class="mb-3">
                            <div
                                :class="[
                                    'flex items-center justify-center w-full px-4 py-2 rounded-full border',
                                    getStatusDisplay(getStudentStatus(student.id)).bgColor,
                                    'bg-opacity-75',
                                    getStatusDisplay(getStudentStatus(student.id)).borderColor,
                                    getStatusDisplay(getStudentStatus(student.id)).textColor,
                                    'shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105',
                                ]"
                            >
                                <LucideIcon :name="getStatusDisplay(getStudentStatus(student.id)).icon" class="w-4 h-4 mr-2" />
                                <span class="font-medium text-sm">{{ getStatusDisplay(getStudentStatus(student.id)).text }}</span>
                            </div>
                        </div>

                        <!-- 狀態切換按鈕 -->
                        <div class="grid grid-cols-2 gap-1">
                            <button
                                @click.stop="
                                    updateStudentStatus(
                                        student.id,
                                        getNextStatus(getStudentStatus(student.id)),
                                    )
                                "
                                class="btn btn-xs btn-primary"
                            >
                                切換狀態
                            </button>
                            <button
                                @click.stop="resetStudentStatus(student.id)"
                                class="btn btn-xs btn-ghost"
                            >
                                重設
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 新增/編輯作業模態 -->
        <dialog ref="homeworkModal" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold mb-4">{{ modalTitle }}</h3>

                <form @submit.prevent="handleHomeworkSubmit" class="space-y-4">
                    <div class="form-control">
                        <label class="label mr-2">
                            <span class="label-text">作業名稱</span>
                        </label>
                        <input
                            v-model="homeworkModalForm.title"
                            type="text"
                            placeholder="例如：數學習作 P.30-32"
                            class="input input-bordered"
                            required
                        />
                    </div>

                    <div class="modal-action">
                        <button type="button" @click="closeHomeworkModal" class="btn btn-ghost">
                            取消
                        </button>
                        <button type="submit" class="btn btn-primary">
                            {{ submitButtonText }}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeHomeworkModal">close</button>
            </form>
        </dialog>

        <!-- 報告匯出模態 -->
        <dialog ref="reportModal" class="modal">
            <div class="modal-box w-11/12 max-w-2xl">
                <h3 class="text-lg font-bold mb-4">{{ reportTitle }}</h3>

                <div class="form-control mb-4">
                    <label class="label">
                        <span class="label-text">報告內容</span>
                    </label>
                    <textarea
                        v-model="reportContent"
                        class="textarea textarea-bordered h-64"
                        readonly
                    ></textarea>
                </div>

                <div class="modal-action">
                    <button @click="copyReportToClipboard" class="btn btn-success">
                        複製到剪貼簿
                    </button>
                    <button @click="closeReportModal" class="btn btn-ghost">關閉</button>
                </div>
            </div>
        </dialog>
    </div>
    <div v-else class="text-center p-8">
        <p>正在載入班級資料...</p>
        <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
</template>

<script setup lang="ts">
import { useClassesStore } from '~/stores/classes'
import type { ClassInfo, Homework, Student } from '~/types'

// 1. Get store and route
const classesStore = useClassesStore()
const route = useRoute()

// 2. Get classId and classInfo from route and store
const classId = computed(() => route.params.id as string)
const classInfo = computed(() => classesStore.classes.find((c) => c.id === classId.value))

// Modal refs
const homeworkModal = ref<HTMLDialogElement>()
const reportModal = ref<HTMLDialogElement>()

// State
const selectedHomework = ref<string | null>(null)
const selectedStudents = ref<string[]>([])
const reportTitle = ref('')
const reportContent = ref('')

const editingHomeworkId = ref<string | null>(null) // 新增：用於追蹤正在編輯的作業ID
const homeworkModalForm = reactive({
    title: '',
})

// Computed
const currentHomework = computed(() => {
    if (!selectedHomework.value || !classInfo.value) return null
    return classInfo.value.homeworks.find((h) => h.id === selectedHomework.value) || null
})

const isEditing = computed(() => editingHomeworkId.value !== null)
const modalTitle = computed(() => (isEditing.value ? '編輯作業' : '新增作業'))
const submitButtonText = computed(() => (isEditing.value ? '更新' : '新增'))

// Constants
const statusOrder = ['pending', 'submitted', 'needs_correction', 'completed']
const statusText = {
    pending: { text: '未繳交', icon: 'Clock' },
    submitted: { text: '已繳交', icon: 'CheckCircle' },
    needs_correction: { text: '待訂正', icon: 'AlertTriangle' },
    completed: { text: '已完成', icon: 'Award' },
}

// Methods
const getStudentStatus = (studentId: string) => {
    if (!currentHomework.value) return 'pending'
    return currentHomework.value.studentStatus[studentId] || 'pending'
}

const getStatusDisplay = (status: string) => {
    return statusText[status as keyof typeof statusText] || { text: '未知', icon: 'HelpCircle' }
}

const getStatusBadgeClass = (status: string) => {
    const classes = {
        pending: 'badge-error',
        submitted: 'badge-success',
        needs_correction: 'badge-warning',
        completed: 'badge-info',
    }
    return classes[status as keyof typeof classes] || 'badge-neutral'
}

const getStatusCount = (status: string) => {
    if (!currentHomework.value) return 0
    return Object.values(currentHomework.value.studentStatus).filter((s) => s === status).length
}

const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusOrder.indexOf(currentStatus)
    const nextIndex = (currentIndex + 1) % statusOrder.length
    return statusOrder[nextIndex]
}

const toggleStudentSelection = (studentId: string) => {
    const index = selectedStudents.value.indexOf(studentId)
    if (index > -1) {
        selectedStudents.value.splice(index, 1)
    } else {
        selectedStudents.value.push(studentId)
    }
}

const updateStudentStatus = (studentId: string, status: string) => {
    if (!currentHomework.value || !classInfo.value) return

    classesStore.updateHomeworkStatus(
        classInfo.value.id,
        currentHomework.value.id,
        studentId,
        status as any,
    )
}

const resetStudentStatus = (studentId: string) => {
    updateStudentStatus(studentId, 'pending')
}

const batchUpdateStatus = (status: string) => {
    if (!currentHomework.value || selectedStudents.value.length === 0) return

    selectedStudents.value.forEach((studentId) => {
        updateStudentStatus(studentId, status)
    })

    selectedStudents.value = []
}

// 顯示新增作業模態框
const showHomeworkModalForAdd = () => {
    editingHomeworkId.value = null
    homeworkModalForm.title = ''
    homeworkModal.value?.showModal()
}

// 顯示編輯作業模態框
const showHomeworkModalForEdit = (homeworkId: string) => {
    const homeworkToEdit = classInfo.value?.homeworks.find((h) => h.id === homeworkId)
    if (homeworkToEdit) {
        editingHomeworkId.value = homeworkId
        homeworkModalForm.title = homeworkToEdit.title
        homeworkModal.value?.showModal()
    }
}

const closeHomeworkModal = () => {
    homeworkModal.value?.close()
}

// 新增作業邏輯
const addHomework = () => {
    if (!homeworkModalForm.title.trim() || !classInfo.value) return

    const newHomework = classesStore.addHomework(classInfo.value.id, homeworkModalForm.title)
    if (newHomework) {
        selectedHomework.value = newHomework.id
    }

    closeHomeworkModal()
}

// 更新作業邏輯
const updateHomework = () => {
    if (!editingHomeworkId.value || !homeworkModalForm.title.trim() || !classInfo.value) return

    classesStore.updateHomeworkTitle(
        classInfo.value.id,
        editingHomeworkId.value,
        homeworkModalForm.title,
    )
    closeHomeworkModal()
}

// 處理模態框提交
const handleHomeworkSubmit = () => {
    if (isEditing.value) {
        updateHomework()
    } else {
        addHomework()
    }
}

const exportIncompleteList = () => {
    if (!currentHomework.value || !classInfo.value) return

    const incompleteStudents = classInfo.value.students.filter((student) => {
        const status = getStudentStatus(student.id)
        return status === 'pending' || status === 'needs_correction'
    })

    const content = [
        `作業：${currentHomework.value.title}`,
        `匯出時間：${new Date().toLocaleString('zh-TW')}`,
        '',
        '未完成學生名單：',
        ...incompleteStudents.map(
            (student) =>
                `${student.id} ${student.name} - ${getStatusText(getStudentStatus(student.id))}`,
        ),
        '',
        `總計：${incompleteStudents.length} 位學生`,
    ].join('\n')

    reportTitle.value = '未完成作業名單'
    reportContent.value = content
    reportModal.value?.showModal()
}

const exportStatusReport = () => {
    if (!currentHomework.value || !classInfo.value) return

    const statusCounts = statusOrder.reduce(
        (acc, status) => {
            acc[status] = getStatusCount(status)
            return acc
        },
        {} as Record<string, number>,
    )

    const content = [
        `作業狀態報告`,
        `作業：${currentHomework.value.title}`,
        `匯出時間：${new Date().toLocaleString('zh-TW')}`,
        '',
        '狀態統計：',
        ...statusOrder.map((status) => `${getStatusText(status)}：${statusCounts[status]} 人`),
        '',
        '詳細名單：',
        ...classInfo.value.students.map(
            (student) =>
                `${student.id} ${student.name} - ${getStatusText(getStudentStatus(student.id))}`,
        ),
    ].join('\n')

    reportTitle.value = '作業狀態報告'
    reportContent.value = content
    reportModal.value?.showModal()
}

const exportStudentReport = (studentId: string) => {
    if (!classInfo.value) return
    const student = classInfo.value.students.find((s) => s.id === studentId)
    if (!student || !currentHomework.value) return

    const incompleteHomeworks = classInfo.value.homeworks.filter((homework) => {
        const status = homework.studentStatus[studentId] || 'pending'
        return status === 'pending' || status === 'needs_correction'
    })

    const content = [
        `個人作業報告`,
        `學生：${student.name} (座號 ${student.id})`,
        `匯出時間：${new Date().toLocaleString('zh-TW')}`,
        '',
        '未完成作業：',
        ...incompleteHomeworks.map(
            (homework) =>
                `• ${homework.title} - ${getStatusText(homework.studentStatus[studentId] || 'pending')}`,
        ),
        '',
        `總計：${incompleteHomeworks.length} 項作業需要完成`,
    ].join('\n')

    reportTitle.value = `${student.name} 的作業報告`
    reportContent.value = content
    reportModal.value?.showModal()
}

const copyReportToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(reportContent.value)
        alert('已複製到剪貼簿！')
    } catch (error) {
        console.error('複製失敗:', error)
        alert('複製失敗，請手動選取文字複製。')
    }
}

const closeReportModal = () => {
    reportModal.value?.close()
}

// 初始化：選擇第一個作業
onMounted(() => {
    if (classInfo.value && classInfo.value.homeworks.length > 0 && !selectedHomework.value) {
        selectedHomework.value = classInfo.value.homeworks[0].id
    }
})

// 監聽作業變化
watch(
    () => classInfo.value?.homeworks,
    (newHomeworks) => {
        if (newHomeworks && newHomeworks.length > 0 && !selectedHomework.value) {
            selectedHomework.value = newHomeworks[0].id
        } else if (newHomeworks && newHomeworks.length === 0) {
            selectedHomework.value = null
        }
    },
)
</script>