<template>
    <div v-if="classInfo && globalHomeworkInfo" class="p-4 sm:p-6 space-y-6">
        <!-- 作業標題 -->
        <div class="flex items-center gap-2 mb-2">
            <NuxtLink :to="`/class/${classId}/homework`" class="btn btn-ghost btn-sm btn-circle">
                <LucideIcon name="ArrowLeft" class="w-5 h-5" />
            </NuxtLink>
            <h2 class="text-2xl font-bold">{{ globalHomeworkInfo.name }}</h2>
        </div>

        <!-- 狀態統計 -->
        <div class="stats stats-horizontal shadow-md overflow-x-auto">
            <div class="stat" v-for="status in statusOrder" :key="status">
                <div class="stat-title">{{ statusText[status].text }}</div>
                <div class="stat-value" :class="[statusTextColors[status]]">
                    {{ getStatusCount(status) }}
                </div>
            </div>
        </div>

        <!-- 快速操作與匯出 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body flex-row flex-wrap items-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold">選取:</span>
                    <button @click="selectAllStudents" class="btn btn-sm btn-outline">全選</button>
                    <button @click="deselectAllStudents" class="btn btn-sm btn-outline">
                        取消全選
                    </button>
                </div>

                <div class="dropdown">
                    <button
                        tabindex="0"
                        role="button"
                        class="btn btn-sm btn-primary"
                        :disabled="selectedStudents.length === 0"
                    >
                        <LucideIcon name="ClipboardEdit" class="w-4 h-4" />
                        批次操作
                    </button>
                    <ul
                        tabindex="0"
                        class="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-40"
                    >
                        <li v-for="status in statusOrder" :key="status">
                            <a @click="batchUpdateStatus(status)">
                                標記為 {{ statusText[status].text }}
                            </a>
                        </li>
                    </ul>
                </div>

                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold">匯出:</span>
                    <button @click="exportIncompleteList" class="btn btn-sm btn-outline">
                        <LucideIcon name="ClipboardList" class="w-4 h-4" />
                        未完成名單
                    </button>
                    <button @click="exportStatusReport" class="btn btn-sm btn-outline">
                        <LucideIcon name="FileSpreadsheet" class="w-4 h-4" />
                        匯出狀態報告
                    </button>
                </div>
            </div>
        </div>

        <!-- 學生狀態列表 -->
        <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div
                v-for="student in classInfo.students"
                :key="student.id"
                class="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                :class="{ 'ring-2 ring-primary': selectedStudents.includes(student.id) }"
                @click="toggleStudentSelection(student.id)"
            >
                <div class="card-body p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="font-semibold text-base">{{ student.name }}</h3>
                            <p class="text-sm text-base-content/70">座號 {{ student.id }}</p>
                        </div>
                        <div
                            class="badge badge-md font-bold"
                            :class="statusBadgeClasses[getStudentStatus(student.id)]"
                        >
                            {{ statusText[getStudentStatus(student.id)].text }}
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-1">
                        <button
                            v-for="status in statusOrder"
                            :key="status"
                            @click.stop="updateStatus(student.id, status)"
                            class="btn btn-xs"
                            :class="{
                                'btn-primary': getStudentStatus(student.id) === status,
                                'btn-ghost': getStudentStatus(student.id) !== status,
                            }"
                        >
                            {{ statusText[status].text }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 報告匯出模態 -->
        <dialog ref="reportModal" class="modal">
            <div class="modal-box w-11/12 max-w-2xl">
                <h3 class="text-lg font-bold mb-4">{{ reportTitle }}</h3>
                <textarea
                    v-model="reportContent"
                    class="textarea textarea-bordered h-64 w-full"
                    readonly
                ></textarea>
                <div class="modal-action">
                    <button @click="copyReportToClipboard" class="btn btn-success">複製</button>
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
import { computed, onMounted, ref } from 'vue'
import { useClassesStore } from '~/stores/classes'
import { useHomeworkStore } from '~/stores/homework'
import { useRoute } from 'vue-router'
import type { ClassInfo, Student } from '~/types'
import LucideIcon from '~/components/LucideIcon.vue'
import { useExcelExport } from '~/composables/useExcelExport'

const classesStore = useClassesStore()
const homeworkStore = useHomeworkStore()
const route = useRoute()
const { exportToExcel } = useExcelExport()

const classId = computed(() => route.params.id as string)
const hwid = computed(() => route.params.hwid as string)

const classInfo = computed(() => classesStore.classes.find((c) => c.id === classId.value))
const globalHomeworkInfo = computed(() =>
    homeworkStore.homeworkList.find((h) => h.id === hwid.value),
)
const homeworkSetting = computed(() => {
    return classInfo.value?.homeworkSettings.find((s) => s.homeworkId === hwid.value)
})

// --- Local State for UI ---
const selectedStudents = ref<string[]>([])
const reportModal = ref<HTMLDialogElement>()
const reportTitle = ref('')
const reportContent = ref('')

// --- Status Definitions ---
type Status = 'pending' | 'submitted' | 'needs_correction' | 'completed'
const statusOrder: Status[] = ['pending', 'submitted', 'needs_correction', 'completed']
const statusText: Record<Status, { text: string; icon: string }> = {
    pending: { text: '未繳交', icon: 'Clock' },
    submitted: { text: '已繳交', icon: 'CheckCircle' },
    needs_correction: { text: '待訂正', icon: 'AlertTriangle' },
    completed: { text: '已完成', icon: 'Award' },
}
const statusTextColors: Record<Status, string> = {
    pending: 'text-error',
    submitted: 'text-success',
    needs_correction: 'text-warning',
    completed: 'text-info',
}
const statusBadgeClasses: Record<Status, string> = {
    pending: 'badge-error text-white',
    submitted: 'badge-success text-white',
    needs_correction: 'badge-warning text-black',
    completed: 'badge-info text-white',
}

// --- Computed Properties & Getters ---
const getStudentStatus = (studentId: string): Status => {
    return homeworkSetting.value?.studentStatus?.[studentId] || 'pending'
}

const getStatusCount = (status: Status): number => {
    if (!homeworkSetting.value?.studentStatus) return 0
    return Object.values(homeworkSetting.value.studentStatus).filter((s) => s === status).length
}

// --- Actions ---
const updateStatus = (studentId: string, newStatus: Status) => {
    classesStore.updateStudentHomeworkStatus(classId.value, hwid.value, studentId, newStatus)
}

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

const deselectAllStudents = () => {
    selectedStudents.value = []
}

const batchUpdateStatus = (status: Status) => {
    if (selectedStudents.value.length === 0) return
    selectedStudents.value.forEach((studentId) => {
        updateStatus(studentId, status)
    })
    deselectAllStudents()
}

// --- Export and Modal Logic ---
const exportStatusReport = () => {
    if (!classInfo.value || !globalHomeworkInfo.value) return

    const today = new Date()
    const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
    const fullDateTimeString = today.toLocaleString('zh-TW')

    const sheetData = {
        sheetName: '學生狀態',
        header: [
            ['班級:', classInfo.value.name],
            ['作業:', globalHomeworkInfo.value.name],
            ['匯出日期:', fullDateTimeString],
            [], // 用於間隔的空行
        ],
        data: classInfo.value.students.map((student) => ({
            座號: student.id,
            姓名: student.name,
            狀態: statusText[getStudentStatus(student.id)].text,
        })),
        columnWidths: [{ wch: 10 }, { wch: 30 }, { wch: 20 }],
        merges: [
            { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }, // 合併 B1:C1
            { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }, // 合併 B2:C2
            { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, // 合併 B3:C3
        ],
    }

    const fileName = `${dateString}-${globalHomeworkInfo.value.name}-${classInfo.value.name}-狀態報告`
    exportToExcel([sheetData], fileName)
}

const exportIncompleteList = () => {
    if (!globalHomeworkInfo.value || !classInfo.value) return
    const incompleteStudents = classInfo.value.students.filter((student) => {
        const status = getStudentStatus(student.id)
        return status === 'pending' || status === 'needs_correction'
    })

    const content = [
        `作業：${globalHomeworkInfo.value.name}`,
        `匯出時間：${new Date().toLocaleString('zh-TW')}`,
        '---',
        '未完成學生名單：',
        ...incompleteStudents.map(
            (student) =>
                `${student.id} ${student.name} - ${statusText[getStudentStatus(student.id)].text}`,
        ),
        `\n總計：${incompleteStudents.length} 位學生`,
    ].join('\n')

    reportTitle.value = '未完成作業名單'
    reportContent.value = content
    reportModal.value?.showModal()
}

const copyReportToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(reportContent.value)
        alert('已複製到剪貼簿！')
    } catch (error) {
        console.error('複製失敗:', error)
    }
}

const closeReportModal = () => {
    reportModal.value?.close()
}

// --- Lifecycle ---
onMounted(() => {
    if (homeworkStore.homeworkList.length === 0) homeworkStore.fetchAllHomework()
    if (classesStore.classes.length === 0) classesStore.loadFromStorage()
})

useHead(() => ({
    title: `${globalHomeworkInfo.value?.name || '作業詳情'} - ${classInfo.value?.name || '班級'}`,
}))
</script>
