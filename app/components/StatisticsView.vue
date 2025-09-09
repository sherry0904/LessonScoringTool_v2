<template>
    <div class="p-6 space-y-6">
        <!-- 頁面標題 -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold text-gradient">統計分析</h1>
                <p class="text-base-content/70 mt-1">課堂表現數據分析</p>
            </div>
            <div class="flex gap-2">
                <button @click="exportReport" class="btn btn-outline btn-sm">
                    <LucideIcon name="Download" class="w-4 h-4" />
                    匯出報告
                </button>
            </div>
        </div>

        <!-- 統計卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- 總分統計 -->
            <div class="stats bg-base-100 shadow-xl border border-base-200">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <LucideIcon name="Trophy" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">平均分數</div>
                    <div class="stat-value text-primary">{{ averageScore }}</div>
                    <div class="stat-desc">全班整體表現</div>
                </div>
            </div>

            <!-- 參與度統計 -->
            <div class="stats bg-base-100 shadow-xl border border-base-200">
                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <LucideIcon name="UserCheck" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">出席率</div>
                    <div class="stat-value text-secondary">{{ attendanceRate }}%</div>
                    <div class="stat-desc">今日課堂參與</div>
                </div>
            </div>

            <!-- 活躍度統計 -->
            <div class="stats bg-base-100 shadow-xl border border-base-200">
                <div class="stat">
                    <div class="stat-figure text-accent">
                        <LucideIcon name="Target" class="w-8 h-8" />
                    </div>
                    <div class="stat-title">活躍學生</div>
                    <div class="stat-value text-accent">{{ activeStudents }}</div>
                    <div class="stat-desc">積極參與討論</div>
                </div>
            </div>
        </div>

        <!-- 詳細分析 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 分數分布 -->
            <div class="card bg-base-100 shadow-xl border border-base-200">
                <div class="card-body">
                    <h2 class="card-title">
                        <LucideIcon name="BarChart3" class="w-5 h-5" />
                        分數分布
                    </h2>
                    <div class="space-y-4">
                        <div
                            v-for="range in scoreRanges"
                            :key="range.label"
                            class="flex items-center justify-between"
                        >
                            <span class="text-sm font-medium">{{ range.label }}</span>
                            <div class="flex items-center gap-2">
                                <div class="w-32 h-2 bg-base-200 rounded-full overflow-hidden">
                                    <div
                                        class="h-full bg-primary rounded-full transition-all duration-500"
                                        :style="{ width: `${range.percentage}%` }"
                                    ></div>
                                </div>
                                <span class="text-sm text-base-content/70 w-12 text-right"
                                    >{{ range.count }}人</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 表現排行榜 -->
            <div class="card bg-base-100 shadow-xl border border-base-200">
                <div class="card-body">
                    <h2 class="card-title">
                        <LucideIcon name="Star" class="w-5 h-5" />
                        表現排行榜
                    </h2>
                    <div class="space-y-3">
                        <div
                            v-for="(student, index) in topPerformers"
                            :key="student.id"
                            class="flex items-center justify-between p-3 rounded-lg bg-base-50 hover:bg-base-100 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    :class="[
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                        index === 0
                                            ? 'bg-yellow-400 text-yellow-900'
                                            : index === 1
                                              ? 'bg-gray-300 text-gray-700'
                                              : index === 2
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-base-200 text-base-content',
                                    ]"
                                >
                                    {{ index + 1 }}
                                </div>
                                <div>
                                    <div class="font-medium">{{ student.name }}</div>
                                    <div class="text-sm text-base-content/70">
                                        座號: {{ student.seatNumber }}
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-lg">{{ student.totalScore }}</div>
                                <div class="text-sm text-base-content/70">總分</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 學習趨勢 -->
        <div class="card bg-base-100 shadow-xl border border-base-200">
            <div class="card-body">
                <h2 class="card-title">
                    <LucideIcon name="Calendar" class="w-5 h-5" />
                    學習趨勢
                </h2>
                <div class="text-center py-8 text-base-content/50">
                    <LucideIcon name="BarChart3" class="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>圖表功能開發中...</p>
                    <p class="text-sm mt-2">未來將顯示學生學習進度趨勢圖</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useClassStore } from '~/stores/class'

const classStore = useClassStore()

// 計算統計數據
const averageScore = computed(() => {
    const students = classStore.presentStudents
    if (students.length === 0) return 0

    const totalScore = students.reduce((sum, student) => sum + student.totalScore, 0)
    return Math.round(totalScore / students.length)
})

const attendanceRate = computed(() => {
    if (classStore.students.length === 0) return 100

    const presentCount = classStore.presentStudents.length
    return Math.round((presentCount / classStore.students.length) * 100)
})

const activeStudents = computed(() => {
    return classStore.presentStudents.filter((student) => student.totalScore > 0).length
})

// 分數分布
const scoreRanges = computed(() => {
    const students = classStore.presentStudents
    const total = students.length

    const ranges = [
        { label: '90-100 分', min: 90, max: 100, count: 0, percentage: 0 },
        { label: '80-89 分', min: 80, max: 89, count: 0, percentage: 0 },
        { label: '70-79 分', min: 70, max: 79, count: 0, percentage: 0 },
        { label: '60-69 分', min: 60, max: 69, count: 0, percentage: 0 },
        { label: '60 分以下', min: 0, max: 59, count: 0, percentage: 0 },
    ]

    students.forEach((student) => {
        const score = student.totalScore
        const range = ranges.find((r) => score >= r.min && score <= r.max)
        if (range) range.count++
    })

    ranges.forEach((range) => {
        range.percentage = total > 0 ? Math.round((range.count / total) * 100) : 0
    })

    return ranges
})

// 表現排行榜
const topPerformers = computed(() => {
    return [...classStore.presentStudents].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5)
})

// 匯出報告
const exportReport = () => {
    const reportData = {
        date: new Date().toLocaleDateString('zh-TW'),
        className: classStore.currentClass?.name || '未命名課堂',
        statistics: {
            averageScore: averageScore.value,
            attendanceRate: attendanceRate.value,
            activeStudents: activeStudents.value,
            totalStudents: classStore.students.length,
        },
        scoreDistribution: scoreRanges.value,
        topPerformers: topPerformers.value,
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `課堂統計報告_${new Date().toISOString().split('T')[0]}.json`
    link.click()
}
</script>
