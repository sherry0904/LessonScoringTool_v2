<template>
    <div v-if="classInfo && homeworkInfo" class="space-y-6">
        <!-- 作業標題與編輯 -->
        <div class="flex items-center gap-2 mb-4">
            <h2 class="text-2xl font-bold">{{ homeworkInfo.title }}</h2>
            <button @click="showHomeworkModalForEdit" class="btn btn-ghost btn-sm btn-circle">
                <LucideIcon name="Edit" class="w-4 h-4" />
            </button>
        </div>
        <!-- 狀態統計 -->
        <div class="stats stats-horizontal shadow">
            <div class="stat" v-for="status in statusOrder" :key="status">
                <div class="stat-title">{{ getStatusText(status) }}</div>
                <div class="stat-value" :class="[getStatusTextColor(status)]">
                    {{ getStatusCount(status) }}
                </div>
            </div>
        </div>
        <!-- 快速操作與匯出功能 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="form-control md:col-span-2">
                        <label class="label mb-2">
                            <span class="label-text">快速操作</span>
                        </label>
                        <div class="flex gap-2 flex-wrap">
                            <button
                                @click="batchUpdateStatus('pending')"
                                class="btn btn-error btn-sm"
                                :disabled="selectedStudents.length === 0"
                            >
                                批量標記未繳交
                            </button>
                            <button
                                @click="batchUpdateStatus('submitted')"
                                class="btn btn-success btn-sm"
                                :disabled="selectedStudents.length === 0"
                            >
                                批量標記已繳交
                            </button>
                            <button
                                @click="batchUpdateStatus('needs_correction')"
                                class="btn btn-warning btn-sm"
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
                            <button @click="selectAllStudents" class="btn btn-sm btn-outline">
                                一鍵全選
                            </button>
                            <button @click="deselectAllStudents" class="btn btn-sm btn-outline">
                                取消全選
                            </button>
                        </div>
                    </div>
                    <div class="form-control md:col-span-1">
                        <label class="label mb-2">
                            <span class="label-text">匯出功能</span>
                        </label>
                        <div class="flex gap-2 flex-wrap">
                            <button @click="exportIncompleteList" class="btn btn-outline btn-sm">
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
                    <div class="mb-3">
                        <div
                            :class="[
                                'flex items-center justify-center w-full px-4 py-2 rounded-full border',
                                getStatusDisplay(getStudentStatus(student.id)).borderColor,
                                'shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105',
                            ]"
                            :style="{
                                backgroundColor: getStatusDisplay(getStudentStatus(student.id))
                                    .bgStyle,
                                color: getStatusDisplay(getStudentStatus(student.id)).textStyle,
                            }"
                        >
                            <LucideIcon
                                :name="getStatusDisplay(getStudentStatus(student.id)).icon"
                                class="w-4 h-4 mr-2"
                            />
                            <span class="font-medium text-sm">{{
                                getStatusDisplay(getStudentStatus(student.id)).text
                            }}</span>
                        </div>
                    </div>
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
        <p>正在載入資料...</p>
        <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
</template>
<script setup lang="ts">
import { useClassesStore } from '~/stores/classes'
import { useRoute, useRouter } from 'vue-router'
import type { ClassInfo, Homework } from '~/types'
import LucideIcon from '~/components/LucideIcon.vue'

const classesStore = useClassesStore()
const route = useRoute()
const router = useRouter()

const classId = computed(() => route.params.id as string)
const hwid = computed(() => route.params.hwid as string)
const classInfo = computed(() => classesStore.classes.find((c) => c.id === classId.value))
const homeworkInfo = computed(
    () => classInfo.value?.homeworks.find((h) => h.id === hwid.value) || null,
)

// 狀態顯示、批次操作、匯出、modal
const statusOrder = ['pending', 'submitted', 'needs_correction', 'completed']
const statusText = {
    pending: {
        text: '未繳交',
        icon: 'Clock',
        bgStyle: 'rgba(239, 68, 68, 0.5)',
        textStyle: '#1a1a1d',
        borderColor: 'border-error',
    },
    submitted: {
        text: '已繳交',
        icon: 'CheckCircle',
        bgStyle: 'rgba(34, 197, 94, 0.5)',
        textStyle: '#1a1a1d',
        borderColor: 'border-success',
    },
    needs_correction: {
        text: '待訂正',
        icon: 'AlertTriangle',
        bgStyle: 'rgba(250, 204, 21, 0.5)',
        textStyle: '#1a1a1d',
        borderColor: 'border-warning',
    },
    completed: {
        text: '已完成',
        icon: 'Award',
        bgStyle: 'rgba(59, 130, 246, 0.5)',
        textStyle: '#1a1a1d',
        borderColor: 'border-info',
    },
}

const selectedStudents = ref<string[]>([])
const reportTitle = ref('')
const reportContent = ref('')
const reportModal = ref<HTMLDialogElement>()

const getStudentStatus = (studentId: string) => {
    if (!homeworkInfo.value) return 'pending'
    return homeworkInfo.value.studentStatus[studentId] || 'pending'
}

const getStatusDisplay = (status: string) => {
    return (
        statusText[status as keyof typeof statusText] || {
            text: '未知',
            icon: 'HelpCircle',
            bgStyle: 'var(--color-neutral, rgba(120, 120, 120, 0.75))',
            textStyle: '#fff',
            borderColor: 'border-base-300',
        }
    )
}

// 狀態數字文字顏色
const getStatusTextColor = (status: string) => {
    const colors = {
        pending: 'text-error',
        submitted: 'text-success',
        needs_correction: 'text-warning',
        completed: 'text-info',
    }
    return colors[status] || 'text-base-content'
}

const getStatusText = (status: string) => {
    return getStatusDisplay(status).text
}

const getStatusCount = (status: string) => {
    if (!homeworkInfo.value) return 0
    return Object.values(homeworkInfo.value.studentStatus).filter((s) => s === status).length
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
    if (!homeworkInfo.value || !classInfo.value) return
    classesStore.updateHomeworkStatus(
        classInfo.value.id,
        homeworkInfo.value.id,
        studentId,
        status as any,
    )
}

const resetStudentStatus = (studentId: string) => {
    updateStudentStatus(studentId, 'pending')
}

const batchUpdateStatus = (status: string) => {
    if (!homeworkInfo.value || selectedStudents.value.length === 0) return
    selectedStudents.value.forEach((studentId) => {
        updateStudentStatus(studentId, status)
    })
    selectedStudents.value = []
}

const exportIncompleteList = () => {
    if (!homeworkInfo.value || !classInfo.value) return
    const incompleteStudents = classInfo.value.students.filter((student) => {
        const status = getStudentStatus(student.id)
        return status === 'pending' || status === 'needs_correction'
    })
    const content = [
        `作業：${homeworkInfo.value.title}`,
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
    if (!homeworkInfo.value || !classInfo.value) return
    const statusCounts = statusOrder.reduce(
        (acc, status) => {
            acc[status] = getStatusCount(status)
            return acc
        },
        {} as Record<string, number>,
    )
    const content = [
        `作業狀態報告`,
        `作業：${homeworkInfo.value.title}`,
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
    if (!student || !homeworkInfo.value) return
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

// 一鍵全選/取消全選
const selectAllStudents = () => {
    if (!classInfo.value) return
    selectedStudents.value = classInfo.value.students.map((s) => s.id)
}
const deselectAllStudents = () => {
    selectedStudents.value = []
}
</script>
