<template>
    <div class="p-6 max-w-7xl mx-auto space-y-8">
        <!-- 標題區 -->
        <PageHeader 
            title="學生管理" 
            description="跨班級檢視與管理所有學生"
        />
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div class="relative">
                    <input
                        :value="searchQuery"
                        @input="updateSearch(($event.target as HTMLInputElement).value)"
                        type="text"
                        placeholder="搜尋學生、班級或座號..."
                        class="input input-bordered pl-10 w-full sm:w-72"
                    />
                    <LucideIcon
                        name="Search"
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50"
                    />
                </div>
                <div class="flex items-center gap-2">
                    <label for="student-sort" class="text-sm font-semibold whitespace-nowrap"
                        >排序方式</label
                    >
                    <select
                        id="student-sort"
                        v-model="sortOption"
                        class="select select-bordered select-sm sm:select-md"
                    >
                        <option
                            v-for="option in sortOptions"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- 學生清單 -->
        <div class="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
            <div class="p-4 flex items-center justify-between border-b border-base-300">
                <h2 class="font-semibold flex items-center gap-2">
                    <LucideIcon name="List" class="w-5 h-5" /> 全部學生 ({{
                        sortedStudents.length
                    }})
                </h2>
                <div class="text-sm text-base-content/60">點擊學生可快速跳轉至其班級頁面</div>
            </div>

            <div v-if="sortedStudents.length" class="max-h-[60vh] overflow-auto custom-scrollbar">
                <table class="table table-zebra">
                    <thead class="sticky top-0 bg-base-200 z-10">
                        <tr>
                            <th class="w-20">座號</th>
                            <th>姓名</th>
                            <th class="w-24 text-center">總分</th>
                            <th class="hidden md:table-cell">所屬班級</th>
                            <th class="hidden md:table-cell">建立時間</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="item in sortedStudents"
                            :key="item.uniqueKey"
                            class="hover cursor-pointer"
                            @click="goToClass(item.classId)"
                        >
                            <td>{{ item.id }}</td>
                            <td class="font-medium">{{ item.name }}</td>
                            <td class="text-center font-mono">{{ item.totalScore }}</td>
                            <td class="hidden md:table-cell">{{ item.className }}</td>
                            <td class="hidden md:table-cell">{{ formatDate(item.createdAt) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="p-10 text-center text-base-content/60">
                <LucideIcon name="UserX" class="w-10 h-10 mx-auto mb-4 opacity-50" />
                <p v-if="searchQuery">找不到符合「{{ searchQuery }}」的學生</p>
                <p v-else>目前沒有任何學生資料</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useClassesStore } from '~/stores/classes'
import { useUIStore } from '~/stores/ui'
import PageHeader from '~/components/PageHeader.vue';

const classesStore = useClassesStore()
const ui = useUIStore()
const searchQuery = ref('')

const sortOptions = [
    { value: 'nameAsc', label: '姓名 (A → Z)' },
    { value: 'nameDesc', label: '姓名 (Z → A)' },
    { value: 'idAsc', label: '座號 (小 → 大)' },
    { value: 'idDesc', label: '座號 (大 → 小)' },
    { value: 'scoreDesc', label: '總分 (高 → 低)' },
    { value: 'scoreAsc', label: '總分 (低 → 高)' },
    { value: 'createdDesc', label: '建立時間 (新 → 舊)' },
    { value: 'createdAsc', label: '建立時間 (舊 → 新)' },
] as const

type SortOptionValue = (typeof sortOptions)[number]['value']
const sortOption = ref<SortOptionValue>('nameAsc')

const updateSearch = (value: string) => {
    searchQuery.value = value
}

interface FlatStudent {
    id: string
    name: string
    totalScore: number
    classId: string
    className: string
    createdAt: Date
    uniqueKey: string
}

const flatStudents = computed<FlatStudent[]>(() => {
    return classesStore.classes.flatMap((cls) =>
        (cls.students || []).map((s) => ({
            id: s.id,
            name: s.name,
            totalScore: s.totalScore || 0,
            classId: cls.id,
            className: cls.name,
            createdAt: new Date(s.createdAt),
            uniqueKey: `${cls.id}-${s.id}`,
        })),
    )
})

const filteredStudents = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return flatStudents.value

    return flatStudents.value.filter(
        (s) =>
            s.name.toLowerCase().includes(q) ||
            s.className.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q),
    )
})

const sortedStudents = computed(() => {
    const students = [...filteredStudents.value]

    switch (sortOption.value) {
        case 'nameAsc':
            return students.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
        case 'nameDesc':
            return students.sort((a, b) => b.name.localeCompare(a.name, 'zh-Hant'))
        case 'idAsc':
            return students.sort((a, b) => a.id.localeCompare(b.id, 'zh-Hant', { numeric: true }))
        case 'idDesc':
            return students.sort((a, b) => b.id.localeCompare(a.id, 'zh-Hant', { numeric: true }))
        case 'scoreDesc':
            return students.sort((a, b) => b.totalScore - a.totalScore)
        case 'scoreAsc':
            return students.sort((a, b) => a.totalScore - b.totalScore)
        case 'createdAsc':
            return students.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        case 'createdDesc':
        default:
            return students.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
})

const totalStudents = computed(() => flatStudents.value.length)
const weeklyUpdatedClasses = computed(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return classesStore.classes.filter((c) => new Date(c.updatedAt).getTime() > weekAgo).length
})
const averagePerClass = computed(() =>
    classesStore.totalClasses ? Math.round(totalStudents.value / classesStore.totalClasses) : 0,
)

const goToClass = (classId: string) => {
    classesStore.selectClass(classId)
    navigateTo(`/class/${classId}`)
}

const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })

onMounted(() => {
    searchQuery.value = ui.searchQuery || ''
})

watch(searchQuery, (value) => {
    ui.setSearchQuery(value)
})

useHead({ title: '學生管理 - 班級分組計分工具' })
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: theme('colors.base-300');
    border-radius: 3px;
}
</style>
