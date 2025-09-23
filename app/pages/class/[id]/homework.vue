<template>
    <NuxtPage />
    <template v-if="route.name === 'class-id-homework'">
        <div v-if="classInfo" class="space-y-6 p-4 sm:p-6">
            <div class="flex justify-between items-center">
                <h3 class="text-2xl font-bold">班級作業列表</h3>
                <!-- 移除新增作業按鈕 -->
            </div>
            <p class="text-base-content/70">
                此處顯示的作業來自「全域作業管理」。您可以在此為班級設定專屬的開始與繳交日期。
            </p>

            <!-- 作業列表 -->
            <div v-if="visibleHomeworks.length > 0" class="space-y-4">
                <div class="glass-card p-4 rounded-xl">
                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div class="flex flex-col gap-2 md:flex-row md:items-center">
                            <label for="homework-search" class="text-sm font-semibold whitespace-nowrap">搜尋作業</label>
                            <label class="input input-bordered flex items-center gap-2 md:flex-1">
                                <LucideIcon name="Search" class="w-4 h-4 opacity-70" />
                                <input
                                    id="homework-search"
                                    v-model="searchTerm"
                                    type="text"
                                    placeholder="輸入作業名稱"
                                    class="grow"
                                />
                            </label>
                        </div>

                        <div class="flex flex-col gap-2 md:flex-row md:items-center">
                            <label for="homework-status-filter" class="text-sm font-semibold whitespace-nowrap">
                                篩選狀態
                            </label>
                            <select
                                id="homework-status-filter"
                                v-model="selectedStatus"
                                class="select select-bordered md:flex-1"
                            >
                                <option v-for="option in statusFilterOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>

                        <div class="flex flex-col gap-2 md:flex-row md:items-center md:col-span-2 lg:col-span-1">
                            <label for="homework-sort" class="text-sm font-semibold whitespace-nowrap">排序方式</label>
                            <select
                                id="homework-sort"
                                v-model="sortOption"
                                class="select select-bordered md:flex-1"
                            >
                                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto glass-card p-4 rounded-xl">
                    <table class="table w-full">
                        <thead>
                            <tr>
                                <th>作業名稱</th>
                                <th>狀態</th>
                                <th>開始日期</th>
                                <th>繳交截止日</th>
                                <th class="text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="hw in paginatedHomeworks" :key="hw.id">
                                <td class="font-semibold">{{ hw.name }}</td>
                                <td>
                                    <span class="badge" :class="getHomeworkStatus(hw.id).badgeClass">
                                        {{ getHomeworkStatus(hw.id).text }}
                                    </span>
                                </td>
                                <td>
                                    <input
                                        type="date"
                                        :value="getHomeworkSettings(hw.id)?.releaseDate?.split('T')[0]"
                                        @change="updateDate(hw.id, 'releaseDate', $event)"
                                        class="input input-bordered input-sm w-40 bg-transparent"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="date"
                                        :value="getHomeworkSettings(hw.id)?.dueDate?.split('T')[0]"
                                        @change="updateDate(hw.id, 'dueDate', $event)"
                                        class="input input-bordered input-sm w-40 bg-transparent"
                                    />
                                </td>
                                <td class="text-right">
                                    <button
                                        @click="goToHomeworkDetail(hw.id)"
                                        class="btn btn-sm btn-ghost"
                                    >
                                        查看繳交詳情
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-if="processedHomeworks.length === 0" class="py-10 text-center text-base-content/70">
                        <p>沒有符合條件的作業。</p>
                    </div>
                </div>

                <div
                    v-if="processedHomeworks.length > 0"
                    class="flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                    <span class="text-sm text-base-content/70">
                        顯示第 {{ classHomeworkPageStart }} - {{ classHomeworkPageEnd }} 筆，共
                        {{ processedHomeworks.length }} 筆
                    </span>
                    <div class="join">
                        <button
                            class="btn btn-sm join-item"
                            :disabled="classHomeworkCurrentPage === 1"
                            @click="classHomeworkCurrentPage = Math.max(1, classHomeworkCurrentPage - 1)"
                        >
                            «
                        </button>
                        <button
                            v-for="page in classHomeworkPageNumbers"
                            :key="page"
                            class="btn btn-sm join-item"
                            :class="{ 'btn-active': classHomeworkCurrentPage === page }"
                            @click="classHomeworkCurrentPage = page"
                        >
                            {{ page }}
                        </button>
                        <button
                            class="btn btn-sm join-item"
                            :disabled="classHomeworkCurrentPage === classHomeworkTotalPages"
                            @click="classHomeworkCurrentPage = Math.min(classHomeworkTotalPages, classHomeworkCurrentPage + 1)"
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="text-center py-12 text-base-content/70 glass-card rounded-xl">
                <LucideIcon name="BookX" class="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>目前沒有指派給這個班級的作業。</p>
                <p class="text-sm mt-2">您可以到「全域作業管理」建立新作業。</p>
            </div>
        </div>
        <div v-else class="text-center p-8">
            <p>正在載入班級資料...</p>
            <span class="loading loading-lg loading-spinner text-primary"></span>
        </div>
    </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useClassesStore } from '~/stores/classes'
import { useHomeworkStore } from '~/stores/homework'
import { useRoute, useRouter } from 'vue-router'
import type { ClassInfo } from '~/types'
import LucideIcon from '~/components/LucideIcon.vue'

const classesStore = useClassesStore()
const homeworkStore = useHomeworkStore()
const route = useRoute()
const router = useRouter()

const classId = computed(() => route.params.id as string)
const classInfo = computed(() => classesStore.classes.find((c) => c.id === classId.value))

const visibleHomeworks = computed(() => {
    if (!classInfo.value) return []
    return homeworkStore.homeworkList.filter(
        (hw) => !hw.isArchived && !hw.hiddenFromClassIds.includes(classId.value),
    )
})

const searchTerm = ref('')

const statusFilterOptions = [
    { value: 'all', label: '全部狀態' },
    { value: '未指定日期', label: '未指定日期' },
    { value: '待開始', label: '待開始' },
    { value: '進行中', label: '進行中' },
    { value: '今日截止', label: '今日截止' },
    { value: '已逾期', label: '已逾期' },
    // 需要新增狀態時在此擴充即可
] as const

const sortOptions = [
    { value: 'releaseDateAsc', label: '開始日期（最早優先）' },
    { value: 'releaseDateDesc', label: '開始日期（最晚優先）' },
    { value: 'dueDateAsc', label: '截止日期（最早優先）' },
    { value: 'dueDateDesc', label: '截止日期（最晚優先）' },
    { value: 'nameAsc', label: '名稱（A → Z）' },
    { value: 'nameDesc', label: '名稱（Z → A）' },
    // 需要新增排序方式時在此擴充即可
] as const

type StatusFilterValue = (typeof statusFilterOptions)[number]['value']
type SortOptionValue = (typeof sortOptions)[number]['value']

const selectedStatus = ref<StatusFilterValue>('all')
const sortOption = ref<SortOptionValue>('releaseDateAsc')

const processedHomeworks = computed(() => {
    const term = searchTerm.value.trim().toLowerCase()

    const normalizeDate = (homeworkId: string, key: 'releaseDate' | 'dueDate') => {
        const value = getHomeworkSettings(homeworkId)?.[key]
        return value ? new Date(value).getTime() : null
    }

    const filtered = visibleHomeworks.value.filter((hw) => {
        const matchesSearch = term ? hw.name.toLowerCase().includes(term) : true
        const statusLabel = getHomeworkStatus(hw.id).text
        const matchesStatus =
            selectedStatus.value === 'all' || statusLabel === selectedStatus.value
        return matchesSearch && matchesStatus
    })

    const sorter = (a: typeof filtered[number], b: typeof filtered[number]) => {
        switch (sortOption.value) {
            case 'releaseDateAsc': {
                const aDate = normalizeDate(a.id, 'releaseDate') ?? Number.POSITIVE_INFINITY
                const bDate = normalizeDate(b.id, 'releaseDate') ?? Number.POSITIVE_INFINITY
                return aDate - bDate
            }
            case 'releaseDateDesc': {
                const aDate = normalizeDate(a.id, 'releaseDate') ?? Number.NEGATIVE_INFINITY
                const bDate = normalizeDate(b.id, 'releaseDate') ?? Number.NEGATIVE_INFINITY
                return bDate - aDate
            }
            case 'dueDateAsc': {
                const aDate = normalizeDate(a.id, 'dueDate') ?? Number.POSITIVE_INFINITY
                const bDate = normalizeDate(b.id, 'dueDate') ?? Number.POSITIVE_INFINITY
                return aDate - bDate
            }
            case 'dueDateDesc': {
                const aDate = normalizeDate(a.id, 'dueDate') ?? Number.NEGATIVE_INFINITY
                const bDate = normalizeDate(b.id, 'dueDate') ?? Number.NEGATIVE_INFINITY
                return bDate - aDate
            }
            case 'nameDesc':
                return b.name.localeCompare(a.name, 'zh-Hant')
            case 'nameAsc':
            default:
                return a.name.localeCompare(b.name, 'zh-Hant')
        }
    }

    return filtered.sort(sorter)
})

const classHomeworkPageSize = 10
const classHomeworkCurrentPage = ref(1)

const classHomeworkTotalPages = computed(() => {
    const total = Math.ceil(processedHomeworks.value.length / classHomeworkPageSize)
    return total > 0 ? total : 1
})

const classHomeworkPageNumbers = computed(() =>
    Array.from({ length: classHomeworkTotalPages.value }, (_, index) => index + 1),
)

const paginatedHomeworks = computed(() => {
    const start = (classHomeworkCurrentPage.value - 1) * classHomeworkPageSize
    return processedHomeworks.value.slice(start, start + classHomeworkPageSize)
})

const classHomeworkPageStart = computed(() => {
    if (processedHomeworks.value.length === 0) return 0
    return (classHomeworkCurrentPage.value - 1) * classHomeworkPageSize + 1
})

const classHomeworkPageEnd = computed(() => {
    const end = classHomeworkCurrentPage.value * classHomeworkPageSize
    return Math.min(end, processedHomeworks.value.length)
})

watch([searchTerm, selectedStatus, sortOption], () => {
    classHomeworkCurrentPage.value = 1
})

watch(classHomeworkTotalPages, (newTotal) => {
    if (classHomeworkCurrentPage.value > newTotal) {
        classHomeworkCurrentPage.value = newTotal
    }
})

function getHomeworkSettings(homeworkId: string) {
    return classInfo.value?.homeworkSettings?.find((s) => s.homeworkId === homeworkId)
}

function getHomeworkStatus(homeworkId: string) {
    const settings = getHomeworkSettings(homeworkId)
    const now = new Date()
    const releaseDate = settings?.releaseDate ? new Date(settings.releaseDate) : null
    const dueDate = settings?.dueDate ? new Date(settings.dueDate) : null

    now.setHours(0, 0, 0, 0)
    if (releaseDate) releaseDate.setHours(0, 0, 0, 0)
    if (dueDate) dueDate.setHours(0, 0, 0, 0)

    if (!releaseDate || !dueDate) {
        return { text: '未指定日期', badgeClass: 'badge-ghost' }
    }
    if (now < releaseDate) {
        return { text: '待開始', badgeClass: 'badge-info' }
    }
    if (now > dueDate) {
        return { text: '已逾期', badgeClass: 'badge-error text-white' }
    }
    if (now.getTime() === dueDate.getTime()) {
        return { text: '今日截止', badgeClass: 'badge-warning' }
    }
    if (now >= releaseDate && now <= dueDate) {
        return { text: '進行中', badgeClass: 'badge-success text-white' }
    }
    return { text: '未知', badgeClass: 'badge-neutral' }
}

const updateDate = (homeworkId: string, dateType: 'releaseDate' | 'dueDate', event: Event) => {
    const target = event.target as HTMLInputElement
    const value = target.value

    classesStore.updateClassHomeworkSettings(classId.value, homeworkId, {
        [dateType]: value ? new Date(value).toISOString() : undefined,
    })
}

const goToHomeworkDetail = (hwid: string) => {
    router.push({ path: `/class/${classId.value}/homework/${hwid}` })
}

onMounted(() => {
    // 確保 store 資料已載入
    if (homeworkStore.homeworkList.length === 0) {
        homeworkStore.fetchAllHomework()
    }
    if (classesStore.classes.length === 0) {
        classesStore.loadFromStorage()
    }
})
</script>
