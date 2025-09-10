<template>
    <div class="p-6 max-w-7xl mx-auto space-y-8">
        <!-- 標題區 -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1
                    class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                >
                    學生管理
                </h1>
                <p class="text-base-content/70 mt-2">跨班級檢視與管理所有學生</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="relative">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="搜尋學生或班級..."
                        class="input input-bordered pl-10 w-72"
                    />
                    <LucideIcon
                        name="Search"
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50"
                    />
                </div>
            </div>
        </div>

        <!-- 總覽統計 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <LucideIcon name="Users" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">總學生數</div>
                    <div class="stat-value text-primary">{{ totalStudents }}</div>
                </div>
            </div>
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <LucideIcon name="GraduationCap" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">班級數</div>
                    <div class="stat-value text-secondary">{{ classesStore.totalClasses }}</div>
                </div>
            </div>
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-accent">
                        <LucideIcon name="Activity" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">本週更新班級</div>
                    <div class="stat-value text-accent">{{ weeklyUpdatedClasses }}</div>
                </div>
            </div>
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure text-info">
                        <LucideIcon name="Sparkles" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">平均每班學生</div>
                    <div class="stat-value text-info">{{ averagePerClass }}</div>
                </div>
            </div>
        </div>

        <!-- 學生清單 -->
        <div class="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
            <div class="p-4 flex items-center justify-between border-b border-base-300">
                <h2 class="font-semibold flex items-center gap-2">
                    <LucideIcon name="List" class="w-5 h-5" /> 全部學生 ({{
                        filteredStudents.length
                    }})
                </h2>
                <div class="text-sm text-base-content/60">點學生可前往其班級</div>
            </div>

            <div v-if="filteredStudents.length" class="max-h-[60vh] overflow-auto custom-scrollbar">
                <table class="table table-zebra">
                    <thead class="sticky top-0 bg-base-200 z-10">
                        <tr>
                            <th class="w-20">座號</th>
                            <th>姓名</th>
                            <th class="hidden md:table-cell">所屬班級</th>
                            <th class="hidden md:table-cell">建立時間</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="item in filteredStudents"
                            :key="item.uniqueKey"
                            class="hover cursor-pointer"
                            @click="goToClass(item.classId)"
                        >
                            <td>{{ item.id }}</td>
                            <td class="font-medium">{{ item.name }}</td>
                            <td class="hidden md:table-cell">{{ item.className }}</td>
                            <td class="hidden md:table-cell">{{ formatDate(item.createdAt) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="p-10 text-center text-base-content/60">
                <LucideIcon name="UserX" class="w-10 h-10 mx-auto mb-4 opacity-50" />
                找不到符合的學生
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const classesStore = useClassesStore()
const search = ref('')

interface FlatStudent {
    id: string
    name: string
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
            classId: cls.id,
            className: cls.name,
            createdAt: new Date(s.createdAt),
            uniqueKey: `${cls.id}-${s.id}`,
        })),
    )
})

const filteredStudents = computed(() => {
    if (!search.value.trim()) return flatStudents.value
    const q = search.value.toLowerCase()
    return flatStudents.value.filter(
        (s) =>
            s.name.toLowerCase().includes(q) ||
            s.className.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q),
    )
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
    navigateTo('/class')
}

const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })

useHead({ title: '學生管理 - 班級經營動力站' })
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
