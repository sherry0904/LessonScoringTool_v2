<template>
    <div class="p-4 sm:p-6">
        <PageHeader
            title="作業管理"
            description="這裡是管理所有班級作業範本的地方。您可以在此建立、編輯、封存作業。"
        />

        <!-- 搜尋與篩選 -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <div class="w-full sm:w-1/2">
                <input
                    type="text"
                    v-model="searchKeyword"
                    class="input input-bordered w-full"
                    placeholder="搜尋作業名稱或備註..."
                />
            </div>
            <div class="flex items-center gap-2">
                <div class="form-control">
                    <label class="label cursor-pointer">
                        <span class="label-text mr-2">顯示已封存作業</span>
                        <input
                            type="checkbox"
                            v-model="showArchived"
                            class="toggle toggle-primary"
                        />
                    </label>
                </div>
                <button class="btn btn-primary" @click="openHomeworkModal()">
                    <LucideIcon name="Plus" class="w-4 h-4" />
                    新增作業
                </button>
            </div>
        </div>

        <div class="overflow-x-auto glass-card p-4 rounded-xl">
            <table class="table">
                <thead>
                    <tr>
                        <th
                            class="cursor-pointer select-none transition text-base-content/80 hover:text-primary relative group"
                            @click="toggleSort('name')"
                        >
                            <span class="inline-flex items-center gap-1">
                                作業名稱
                                <span v-if="sortBy === 'name'" class="w-3 h-3">
                                    <svg
                                        v-if="sortOrder === 'asc'"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 16 16"
                                        stroke="currentColor"
                                        class="w-3 h-3"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-width="2"
                                            d="M8 4l4 6H4l4-6z"
                                        />
                                    </svg>
                                    <svg
                                        v-else
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 16 16"
                                        stroke="currentColor"
                                        class="w-3 h-3"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-width="2"
                                            d="M8 12l-4-6h8l-4 6z"
                                        />
                                    </svg>
                                </span>
                            </span>
                            <!-- 移除提示字樣，只保留 icon 與 hover 效果 -->
                        </th>
                        <th
                            class="cursor-pointer select-none transition text-base-content/80 hover:text-primary relative group"
                            @click="toggleSort('createdAt')"
                        >
                            <span class="inline-flex items-center gap-1">
                                建立日期
                                <span v-if="sortBy === 'createdAt'" class="w-3 h-3">
                                    <svg
                                        v-if="sortOrder === 'asc'"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 16 16"
                                        stroke="currentColor"
                                        class="w-3 h-3"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-width="2"
                                            d="M8 4l4 6H4l4-6z"
                                        />
                                    </svg>
                                    <svg
                                        v-else
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 16 16"
                                        stroke="currentColor"
                                        class="w-3 h-3"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-width="2"
                                            d="M8 12l-4-6h8l-4 6z"
                                        />
                                    </svg>
                                </span>
                            </span>
                        </th>
                        <th>備註</th>
                        <th>狀態</th>
                        <th>班級概況</th>
                        <th class="text-right">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="hw in paginatedHomeworkList" :key="hw.id" class="align-top">
                        <td class="align-top">
                            <div class="font-semibold text-base-content">{{ hw.name }}</div>
                            <div
                                v-if="(hw.hiddenFromClassIds?.length ?? 0) > 0"
                                class="text-xs text-base-content/60 mt-1"
                            >
                                已對 {{ hw.hiddenFromClassIds?.length }} 個班級隱藏
                            </div>
                        </td>
                        <td class="align-top whitespace-nowrap">
                            {{ new Date(hw.createdAt).toLocaleDateString() }}
                        </td>
                        <td class="align-top max-w-xs">
                            <p class="text-sm text-base-content/70 whitespace-pre-line">
                                {{ hw.notes || '—' }}
                            </p>
                        </td>
                        <td class="align-top">
                            <span v-if="hw.isArchived" class="badge badge-ghost">已封存</span>
                            <span v-else class="badge badge-success">啟用中</span>
                        </td>
                        <td class="align-top">
                            <div
                                v-if="(homeworkClassSummaries[hw.id] || []).length > 0"
                                class="flex items-center gap-2"
                            >
                                <button
                                    class="btn btn-xs btn-outline gap-1"
                                    @click="openSummaryModal(hw.id)"
                                >
                                    <LucideIcon name="BarChart3" class="w-3 h-3" />
                                    <span>概況</span>
                                </button>
                                <span class="text-xs text-base-content/60">
                                    {{ homeworkClassSummaries[hw.id].length }} 班
                                </span>
                            </div>
                            <span v-else class="text-xs text-base-content/60">尚未指派</span>
                        </td>
                        <td class="text-right">
                            <div class="flex justify-end space-x-2">
                                <div class="tooltip" data-tip="編輯">
                                    <button
                                        class="btn btn-ghost btn-sm"
                                        @click="openHomeworkModal(hw)"
                                    >
                                        <LucideIcon name="Edit" class="w-4 h-4" />
                                    </button>
                                </div>
                                <div class="tooltip" :data-tip="hw.isArchived ? '恢復' : '封存'">
                                    <button
                                        class="btn btn-ghost btn-sm"
                                        @click="homeworkStore.toggleArchive(hw.id)"
                                    >
                                        <LucideIcon
                                            :name="hw.isArchived ? 'ArchiveRestore' : 'Archive'"
                                            class="w-4 h-4"
                                        />
                                    </button>
                                </div>
                                <div class="tooltip" data-tip="刪除">
                                    <button
                                        class="btn btn-ghost btn-sm text-error"
                                        @click="handleDelete(hw.id)"
                                    >
                                        <LucideIcon name="Trash2" class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="filteredHomeworkList.length === 0">
                        <td colspan="6" class="text-center py-8">
                            <p class="text-base-content/60">
                                {{ showArchived ? '沒有已封存的作業' : '尚未建立任何作業範本' }}
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            v-if="filteredHomeworkList.length > 0"
            class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
            <span class="text-sm text-base-content/70">
                顯示第 {{ homeworkPageStart }} - {{ homeworkPageEnd }} 筆，共
                {{ filteredHomeworkList.length }} 筆
            </span>
            <div class="join">
                <button
                    class="btn btn-sm join-item"
                    :disabled="homeworkCurrentPage === 1"
                    @click="homeworkCurrentPage = Math.max(1, homeworkCurrentPage - 1)"
                >
                    «
                </button>
                <button
                    v-for="page in homeworkPageNumbers"
                    :key="page"
                    class="btn btn-sm join-item"
                    :class="{ 'btn-active': homeworkCurrentPage === page }"
                    @click="homeworkCurrentPage = page"
                >
                    {{ page }}
                </button>
                <button
                    class="btn btn-sm join-item"
                    :disabled="homeworkCurrentPage === homeworkTotalPages"
                    @click="
                        homeworkCurrentPage = Math.min(homeworkTotalPages, homeworkCurrentPage + 1)
                    "
                >
                    »
                </button>
            </div>
        </div>

        <!-- 班級概況 Modal -->
        <dialog ref="summaryModalRef" class="modal" @close="handleSummaryModalClose">
            <div class="modal-box max-w-3xl bg-base-100">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-bold">
                            班級概況
                            <span
                                v-if="summaryModalHomework"
                                class="text-base-content/70 text-sm font-normal"
                            >
                                - {{ summaryModalHomework.name }}
                            </span>
                        </h3>
                        <p class="text-xs text-base-content/60 mt-1">
                            顯示目前已指派班級的繳交狀態統計，協助快速掌握進度。
                        </p>
                    </div>
                    <button class="btn btn-sm btn-ghost" @click="closeSummaryModal">關閉</button>
                </div>

                <div v-if="summaryModalSummaries.length > 0" class="overflow-x-auto">
                    <table class="table table-sm table-zebra">
                        <thead>
                            <tr>
                                <th>班級</th>
                                <th class="text-center">學生數</th>
                                <th v-for="status in statusOrder" :key="status" class="text-center">
                                    {{ statusText[status].text }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="summary in summaryModalSummaries"
                                :key="summary.classId"
                                class="transition-colors hover:bg-primary/10 group"
                            >
                                <td class="align-top">
                                    <div
                                        class="font-semibold text-base-content group-hover:text-primary"
                                    >
                                        {{ summary.className }}
                                    </div>
                                    <div
                                        v-if="!summary.hasData"
                                        class="text-xs text-base-content/50 mt-1 group-hover:text-base-content/70"
                                    >
                                        尚未設定繳交紀錄
                                    </div>
                                </td>
                                <td class="text-center font-medium group-hover:text-primary">
                                    {{ summary.totalStudents }}
                                </td>
                                <td
                                    v-for="status in statusOrder"
                                    :key="status"
                                    class="text-center font-medium transition-colors"
                                >
                                    <span v-if="summary.hasData" class="group-hover:text-primary">
                                        {{ summary.counts[status] }}
                                    </span>
                                    <span v-else class="text-base-content/30">—</span>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="bg-base-200">
                                <th>總計</th>
                                <th class="text-center">{{ summaryModalTotals.totalStudents }}</th>
                                <th v-for="status in statusOrder" :key="status" class="text-center">
                                    {{ summaryModalTotals.counts[status] }}
                                </th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div v-else class="py-10 text-center text-base-content/60">
                    目前沒有可顯示的班級紀錄。
                </div>

                <div class="modal-action">
                    <button class="btn btn-primary" @click="closeSummaryModal">了解</button>
                </div>
            </div>
        </dialog>

        <!-- 新增/編輯作業 Modal -->
        <div class="modal" :class="{ 'modal-open': isModalOpen }" @click="closeHomeworkModal">
            <div class="modal-box max-w-lg bg-base-100 shadow-xl" @click.stop>
                <h3 class="font-bold text-xl mb-2 text-primary">
                    {{ isEditing ? '編輯作業' : '新增作業' }}
                </h3>
                <form @submit.prevent="handleSave" class="space-y-5">
                    <div>
                        <label class="label mb-1">
                            <span class="label-text text-base font-semibold"
                                >作業名稱 <span class="text-error">*</span></span
                            >
                        </label>
                        <input
                            type="text"
                            v-model="editableHomework.name"
                            placeholder="請輸入作業名稱"
                            class="input input-bordered w-full focus:outline-primary"
                            required
                        />
                    </div>
                    <div>
                        <label class="label mb-1">
                            <span class="label-text text-base font-semibold"
                                >備註 <span class="text-xs text-base-content/60">(選填)</span></span
                            >
                        </label>
                        <textarea
                            v-model="editableHomework.notes"
                            class="textarea textarea-bordered w-full min-h-[80px] focus:outline-primary"
                            placeholder="請輸入備註內容"
                        ></textarea>
                    </div>
                    <div>
                        <label class="label mb-1">
                            <span class="label-text text-base font-semibold"
                                >對以下班級隱藏
                                <span class="text-xs text-base-content/60">(可多選)</span></span
                            >
                        </label>
                        <div
                            class="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2 border rounded-lg bg-base-200 max-h-40 overflow-y-auto"
                        >
                            <label
                                v-for="classInfo in classesStore.classes"
                                :key="classInfo.id"
                                class="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-base-300 transition-colors cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    :value="classInfo.id"
                                    v-model="editableHomework.hiddenFromClassIds"
                                    class="checkbox checkbox-sm checkbox-primary"
                                />
                                <span class="label-text">{{ classInfo.name }}</span>
                            </label>
                        </div>
                    </div>
                    <div class="modal-action mt-6">
                        <button type="button" class="btn btn-ghost" @click="closeHomeworkModal">
                            取消
                        </button>
                        <button type="submit" class="btn btn-primary">
                            {{ isEditing ? '儲存變更' : '確認新增' }}
                        </button>
                    </div>
                </form>
                <button
                    class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    @click="closeHomeworkModal"
                >
                    ✕
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import PageHeader from '~/components/PageHeader.vue'

// SEO and other page settings
useHead({
    title: '作業管理',
})

const homeworkStore = useHomeworkStore()
const classesStore = useClassesStore()

const isModalOpen = ref(false)
const isEditing = ref(false)
const editableHomework = ref<Partial<GlobalHomework>>({ hiddenFromClassIds: [] })
const showArchived = ref(false)
const searchKeyword = ref('')

const sortBy = ref<'name' | 'createdAt'>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

function toggleSort(field: 'name' | 'createdAt') {
    if (sortBy.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortBy.value = field
        sortOrder.value = 'asc'
    }
}

const filteredHomeworkList = computed(() => {
    // 先依封存狀態篩選
    let list = homeworkStore.homeworkList.filter((hw) => hw.isArchived === showArchived.value)
    // 再依搜尋關鍵字過濾（名稱或備註）
    if (searchKeyword.value.trim()) {
        const kw = searchKeyword.value.trim().toLowerCase()
        list = list.filter(
            (hw) =>
                hw.name.toLowerCase().includes(kw) ||
                (hw.notes?.toLowerCase().includes(kw) ?? false),
        )
    }
    // 排序
    list = [...list].sort((a, b) => {
        if (sortBy.value === 'name') {
            const cmp = a.name.localeCompare(b.name)
            return sortOrder.value === 'asc' ? cmp : -cmp
        } else {
            const cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            return sortOrder.value === 'asc' ? cmp : -cmp
        }
    })
    return list
})

const homeworkPageSize = 10
const homeworkCurrentPage = ref(1)

const homeworkTotalPages = computed(() => {
    const total = Math.ceil(filteredHomeworkList.value.length / homeworkPageSize)
    return total > 0 ? total : 1
})

const homeworkPageNumbers = computed(() =>
    Array.from({ length: homeworkTotalPages.value }, (_, index) => index + 1),
)

const paginatedHomeworkList = computed(() => {
    const start = (homeworkCurrentPage.value - 1) * homeworkPageSize
    return filteredHomeworkList.value.slice(start, start + homeworkPageSize)
})

const homeworkPageStart = computed(() => {
    if (filteredHomeworkList.value.length === 0) return 0
    return (homeworkCurrentPage.value - 1) * homeworkPageSize + 1
})

const homeworkPageEnd = computed(() => {
    const end = homeworkCurrentPage.value * homeworkPageSize
    return Math.min(end, filteredHomeworkList.value.length)
})

watch([searchKeyword, showArchived], () => {
    homeworkCurrentPage.value = 1
})

watch(homeworkTotalPages, (newTotal) => {
    if (homeworkCurrentPage.value > newTotal) {
        homeworkCurrentPage.value = newTotal
    }
})

type Status = 'pending' | 'submitted' | 'needs_correction' | 'completed'

const statusOrder: Status[] = ['pending', 'submitted', 'needs_correction', 'completed']
const statusText: Record<Status, { text: string; short: string }> = {
    pending: { text: '未繳交', short: '未交' },
    submitted: { text: '已繳交', short: '已交' },
    needs_correction: { text: '待訂正', short: '待訂' },
    completed: { text: '已完成', short: '完成' },
}
const statusBadgeClasses: Record<Status, string> = {
    pending: 'badge-outline border-error text-error',
    submitted: 'badge-outline border-success text-success',
    needs_correction: 'badge-outline border-warning text-warning',
    completed: 'badge-outline border-info text-info',
}

interface HomeworkClassSummary {
    classId: string
    className: string
    totalStudents: number
    counts: Record<Status, number>
    hasData: boolean
}

const homeworkClassSummaries = computed<Record<string, HomeworkClassSummary[]>>(() => {
    const summaries: Record<string, HomeworkClassSummary[]> = {}

    if (!Array.isArray(homeworkStore.homeworkList) || !Array.isArray(classesStore.classes)) {
        return summaries
    }

    for (const homework of homeworkStore.homeworkList) {
        const visibleClasses = classesStore.classes.filter((classInfo) => {
            if (!Array.isArray(homework.hiddenFromClassIds)) return true
            return !homework.hiddenFromClassIds.includes(classInfo.id)
        })

        summaries[homework.id] = visibleClasses.map((classInfo) => {
            const counts: Record<Status, number> = {
                pending: 0,
                submitted: 0,
                needs_correction: 0,
                completed: 0,
            }

            const settings = classInfo.homeworkSettings?.find(
                (setting) => setting.homeworkId === homework.id,
            )

            if (!settings || !settings.studentStatus) {
                return {
                    classId: classInfo.id,
                    className: classInfo.name,
                    totalStudents: classInfo.students.length,
                    counts,
                    hasData: false,
                }
            }

            classInfo.students.forEach((student) => {
                const rawStatus = settings.studentStatus?.[student.id] ?? 'pending'
                const status = (
                    statusOrder.includes(rawStatus as Status) ? (rawStatus as Status) : 'pending'
                ) as Status
                counts[status] += 1
            })

            return {
                classId: classInfo.id,
                className: classInfo.name,
                totalStudents: classInfo.students.length,
                counts,
                hasData: true,
            }
        })
    }

    return summaries
})

const summaryModalRef = ref<HTMLDialogElement | null>(null)
const summaryModalHomeworkId = ref<string | null>(null)

const summaryModalHomework = computed(() => {
    if (!summaryModalHomeworkId.value) return null
    return homeworkStore.homeworkList.find((hw) => hw.id === summaryModalHomeworkId.value) || null
})

const summaryModalSummaries = computed(() => {
    if (!summaryModalHomeworkId.value) return []
    return homeworkClassSummaries.value[summaryModalHomeworkId.value] || []
})

const summaryModalTotals = computed(() => {
    const counts: Record<Status, number> = {
        pending: 0,
        submitted: 0,
        needs_correction: 0,
        completed: 0,
    }
    let totalStudents = 0

    summaryModalSummaries.value.forEach((summary) => {
        totalStudents += summary.totalStudents
        if (!summary.hasData) return
        statusOrder.forEach((status) => {
            counts[status] += summary.counts[status]
        })
    })

    return { totalStudents, counts }
})

const openSummaryModal = async (homeworkId: string) => {
    const summaries = homeworkClassSummaries.value[homeworkId] || []
    if (summaries.length === 0) return

    summaryModalHomeworkId.value = homeworkId
    await nextTick()
    summaryModalRef.value?.showModal()
}

const closeSummaryModal = () => {
    summaryModalRef.value?.close()
}

const handleSummaryModalClose = () => {
    summaryModalHomeworkId.value = null
}

const openHomeworkModal = (homework: GlobalHomework | null = null) => {
    if (homework) {
        isEditing.value = true
        editableHomework.value = {
            ...homework,
            hiddenFromClassIds: [...(homework.hiddenFromClassIds || [])],
        }
    } else {
        isEditing.value = false
        editableHomework.value = { name: '', notes: '', hiddenFromClassIds: [] }
    }
    isModalOpen.value = true
}

const closeHomeworkModal = () => {
    isModalOpen.value = false
}

const handleSave = () => {
    if (!editableHomework.value.name) return

    if (isEditing.value) {
        homeworkStore.updateHomework(editableHomework.value.id!, editableHomework.value)
    } else {
        homeworkStore.addHomework({
            name: editableHomework.value.name!,
            notes: editableHomework.value.notes,
            hiddenFromClassIds: editableHomework.value.hiddenFromClassIds || [],
        })
    }
    closeHomeworkModal()
}

const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個作業範本嗎？此操作無法復原。')) {
        homeworkStore.deleteHomework(id)
    }
}

// Fetch data on component mount
onMounted(() => {
    homeworkStore.fetchAllHomework()
    classesStore.loadFromStorage() // 確保班級列表已載入
})
</script>
