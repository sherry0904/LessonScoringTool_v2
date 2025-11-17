<template>
    <div v-if="classInfo" class="space-y-6">
        <!-- 成績統計概覽 -->
        <div class="stats stats-horizontal shadow">
            <div class="stat">
                <div class="stat-title">班級平均</div>
                <div class="stat-value text-primary">{{ classAverage.toFixed(1) }}</div>
                <div class="stat-desc">總評分記錄：{{ totalScores }}</div>
            </div>
            <div class="stat">
                <div class="stat-title">最高分</div>
                <div class="stat-value text-success">{{ highestScore }}</div>
                <div class="stat-desc">{{ topStudent?.name }}</div>
            </div>
            <div class="stat">
                <div class="stat-title">最低分</div>
                <div class="stat-value text-error">{{ lowestScore }}</div>
                <div class="stat-desc">{{ bottomStudent?.name }}</div>
            </div>
            <!--
                <div class="stat">
                    <div class="stat-title">及格率</div>
                    <div class="stat-value">{{ passRate }}%</div>
                    <div class="stat-desc">以60分為及格標準</div>
                </div>
                -->
        </div>

        <!-- 操作面板 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex flex-wrap gap-4 items-center justify-between">
                    <div class="flex flex-wrap gap-4 items-center">
                        <div class="flex items-center gap-4">
                            <label class="label mb-0">
                                <span class="label-text">排序方式</span>
                            </label>
                            <select v-model="sortBy" class="select select-bordered w-32">
                                <option value="totalScore">總分</option>
                                <option value="averageScore">平均分</option>
                                <option value="name">姓名</option>
                                <option value="id">座號</option>
                            </select>
                            <label class="label mb-0 ml-4">
                                <span class="label-text">排序順序</span>
                            </label>
                            <div class="btn-group">
                                <button
                                    :class="[
                                        'btn btn-sm',
                                        'mr-2',
                                        sortOrder === 'desc' ? 'btn-active' : '',
                                    ]"
                                    @click="sortOrder = 'desc'"
                                >
                                    高到低
                                </button>
                                <button
                                    :class="['btn btn-sm', sortOrder === 'asc' ? 'btn-active' : '']"
                                    @click="sortOrder = 'asc'"
                                >
                                    低到高
                                </button>
                            </div>
                        </div>

                        <!--
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">評分類別</span>
                                </label>
                                <select v-model="filterCategory" class="select select-bordered">
                                    <option value="">全部類別</option>
                                    <option
                                        v-for="category in scoreCategories"
                                        :key="category.id"
                                        :value="category.id"
                                    >
                                        {{ category.name }}
                                    </option>
                                </select>
                            </div>
                            -->
                    </div>

                    <div class="flex gap-2">
                        <button @click="exportGradeReport" class="btn btn-primary gap-2">
                            <LucideIcon name="Download" class="w-4 h-4" />
                            匯出成績單
                        </button>
                        <!--
                            <button @click="showStatisticsChart" class="btn btn-info gap-2">
                                <LucideIcon name="BarChart3" class="w-4 h-4" />
                                統計圖表
                            </button>
                            -->
                    </div>
                </div>
            </div>
        </div>

        <!-- 成績表格 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-0">
                <div class="overflow-x-auto">
                    <table class="table table-zebra">
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>座號</th>
                                <th>姓名</th>
                                <th>總分</th>
                                <!-- <th>平均分</th> -->
                                <!-- <th v-if="!filterCategory">各類別分數</th> -->
                                <!-- <th v-else>{{ getCategoryName(filterCategory) }}</th> -->
                                <!-- <th>趨勢</th> -->
                                <!-- <th>操作</th> -->
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(student, index) in sortedStudents"
                                :key="student.id"
                                :class="getRowClass(student, index)"
                            >
                                <td>
                                    <div class="flex items-center gap-2">
                                        <span class="font-bold">{{ index + 1 }}</span>
                                        <div v-if="index < 3" class="badge badge-warning badge-sm">
                                            {{ ['🥇', '🥈', '🥉'][index] }}
                                        </div>
                                    </div>
                                </td>
                                <td>{{ student.id }}</td>
                                <td>
                                    <div class="font-semibold">{{ student.name }}</div>
                                    <div
                                        v-if="!student.isPresent"
                                        class="badge badge-error badge-xs"
                                    >
                                        缺席
                                    </div>
                                </td>
                                <td>
                                    <span class="font-bold text-lg">{{ student.totalScore }}</span>
                                </td>
                                <!-- <td>{{ student.averageScore.toFixed(1) }}</td> -->
                                <!--
                                <td>
                                    <div v-if="!filterCategory" class="flex flex-wrap gap-1">
                                        <div
                                            v-for="category in scoreCategories"
                                            :key="category.id"
                                            class="badge badge-sm"
                                            :style="{
                                                backgroundColor: category.color,
                                                color: 'white',
                                            }"
                                        >
                                            {{ getCategoryScore(student, category.id) }}
                                        </div>
                                    </div>
                                    <div v-else class="font-semibold">
                                        {{ getCategoryScore(student, filterCategory) }}
                                    </div>
                                </td>
                                <td>
                                    <div :class="getTrendBadgeClass(getTrend(student))">
                                        {{ getTrendText(getTrend(student)) }}
                                    </div>
                                </td>
                                <td>
                                    <div class="dropdown dropdown-end">
                                        <div
                                            tabindex="0"
                                            role="button"
                                            class="btn btn-ghost btn-xs"
                                        >
                                            操作
                                        </div>
                                        <ul
                                            tabindex="0"
                                            class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow"
                                        >
                                            <li>
                                                <a @click="viewStudentDetail(student.id)">
                                                    <LucideIcon name="Eye" class="w-3 h-3" />
                                                    查看詳情
                                                </a>
                                            </li>
                                            <li>
                                                <a @click="exportStudentGrade(student.id)">
                                                    <LucideIcon name="FileText" class="w-3 h-3" />
                                                    個人成績單
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                                -->
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- 學生詳情模態 -->
        <dialog ref="detailModal" class="modal">
            <div class="modal-box w-11/12 max-w-4xl">
                <h3 class="text-lg font-bold mb-4" v-if="selectedStudentForDetail">
                    {{ selectedStudentForDetail.name }} 的詳細成績
                </h3>

                <div v-if="selectedStudentForDetail" class="space-y-6">
                    <!-- 學生統計 -->
                    <div class="stats stats-horizontal shadow">
                        <div class="stat">
                            <div class="stat-title">總分</div>
                            <div class="stat-value text-primary">
                                {{ selectedStudentForDetail.totalScore }}
                            </div>
                        </div>
                        <div class="stat">
                            <div class="stat-title">平均分</div>
                            <div class="stat-value">
                                {{ selectedStudentForDetail.averageScore.toFixed(1) }}
                            </div>
                        </div>
                        <div class="stat">
                            <div class="stat-title">班級排名</div>
                            <div class="stat-value">
                                {{ getStudentRanking(selectedStudentForDetail.id) }}
                            </div>
                        </div>
                    </div>

                    <!-- 各類別得分 -->
                    <div class="card bg-base-100">
                        <div class="card-body">
                            <h4 class="card-title text-base">各類別得分統計</h4>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div
                                    v-for="category in scoreCategories"
                                    :key="category.id"
                                    class="stat bg-base-200 rounded-lg"
                                >
                                    <div class="stat-title text-xs">{{ category.name }}</div>
                                    <div
                                        class="stat-value text-sm"
                                        :style="{ color: category.color }"
                                    >
                                        {{
                                            getCategoryScore(selectedStudentForDetail, category.id)
                                        }}
                                    </div>
                                    <div class="stat-desc text-xs">
                                        {{
                                            getCategoryCount(selectedStudentForDetail, category.id)
                                        }}
                                        次記錄
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 評分記錄 -->
                    <div class="card bg-base-100">
                        <div class="card-body">
                            <h4 class="card-title text-base">評分記錄</h4>
                            <div class="max-h-64 overflow-y-auto space-y-2">
                                <div
                                    v-for="score in selectedStudentForDetail.scores
                                        .slice()
                                        .reverse()"
                                    :key="score.id"
                                    class="flex justify-between items-center p-3 bg-base-200 rounded"
                                >
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <span
                                                :class="[
                                                    'badge',
                                                    score.value > 0
                                                        ? 'badge-success'
                                                        : 'badge-error',
                                                ]"
                                            >
                                                {{ score.value > 0 ? '+' : '' }}{{ score.value }}
                                            </span>
                                            <span class="font-medium">{{
                                                score.categoryName
                                            }}</span>
                                        </div>
                                        <p
                                            v-if="score.reason"
                                            class="text-sm text-base-content/70 mt-1"
                                        >
                                            {{ score.reason }}
                                        </p>
                                    </div>
                                    <div class="text-sm text-base-content/70">
                                        {{ formatDateTime(score.timestamp) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-action">
                    <button @click="closeDetailModal" class="btn btn-ghost">關閉</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeDetailModal">close</button>
            </form>
        </dialog>

        <!-- 報告匯出模態 -->
        <dialog ref="reportModal" class="modal">
            <div class="modal-box w-11/12 max-w-2xl">
                <h3 class="text-lg font-bold mb-4">{{ reportTitle }}</h3>

                <div class="form-control mb-4">
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

        <!-- 統計圖表模態 -->
        <dialog ref="chartModal" class="modal">
            <div class="modal-box w-11/12 max-w-4xl">
                <h3 class="text-lg font-bold mb-4">成績統計圖表</h3>

                <div class="space-y-6">
                    <!-- 分數分布 -->
                    <div class="card bg-base-100">
                        <div class="card-body">
                            <h4 class="card-title text-base">分數分布</h4>
                            <div class="grid grid-cols-5 gap-2 text-center">
                                <div
                                    v-for="(range, index) in scoreRanges"
                                    :key="index"
                                    class="stat bg-base-200 rounded"
                                >
                                    <div class="stat-title text-xs">{{ range.label }}</div>
                                    <div class="stat-value text-sm">{{ range.count }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 類別得分統計 -->
                    <div class="card bg-base-100">
                        <div class="card-body">
                            <h4 class="card-title text-base">各類別平均分</h4>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div
                                    v-for="stat in categoryStats"
                                    :key="stat.categoryId"
                                    class="stat bg-base-200 rounded"
                                >
                                    <div class="stat-title text-xs">{{ stat.categoryName }}</div>
                                    <div
                                        class="stat-value text-sm"
                                        :style="{ color: getCategoryColor(stat.categoryId) }"
                                    >
                                        {{ stat.average.toFixed(1) }}
                                    </div>
                                    <div class="stat-desc text-xs">{{ stat.count }} 次記錄</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-action">
                    <button @click="closeChartModal" class="btn btn-ghost">關閉</button>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useClassesStore } from '~/stores/classes'
import type { ClassInfo, Student } from '~/types'
import { formatDateTime } from '~/utils/format'

// 1. Get store and route
const classesStore = useClassesStore()
const route = useRoute()

// 2. Get classId and classInfo from route and store
const classId = computed(() => route.params.id as string)
const classInfo = computed(() => classesStore.classes.find((c) => c.id === classId.value))

// Modal refs
const detailModal = ref<HTMLDialogElement>()
const reportModal = ref<HTMLDialogElement>()
const chartModal = ref<HTMLDialogElement>()

// State
const sortBy = ref('totalScore')
const sortOrder = ref<'asc' | 'desc'>('desc')
const filterCategory = ref('')
const selectedStudentForDetail = ref<Student | null>(null)
const reportTitle = ref('')
const reportContent = ref('')

const scoreCategories = [
    { id: 'participation', name: '參與度', color: '#3b82f6' },
    { id: 'homework', name: '作業', color: '#10b981' },
    { id: 'behavior', name: '行為表現', color: '#f59e0b' },
    { id: 'creativity', name: '創意思考', color: '#8b5cf6' },
    { id: 'group', name: '小組活動', color: '#ef4444' },
]

// Computed
const sortedStudents = computed(() => {
    if (!classInfo.value) return []
    let students = [...classInfo.value.students]

    // 根據排序方式排序
    students.sort((a, b) => {
        let aValue, bValue

        switch (sortBy.value) {
            case 'totalScore':
                aValue = a.totalScore
                bValue = b.totalScore
                break
            case 'averageScore':
                aValue = a.averageScore
                bValue = b.averageScore
                break
            case 'name':
                aValue = a.name
                bValue = b.name
                break
            case 'id':
                aValue = parseInt(a.id) || 0
                bValue = parseInt(b.id) || 0
                break
            default:
                return 0
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder.value === 'desc'
                ? bValue.localeCompare(aValue)
                : aValue.localeCompare(bValue)
        } else {
            return sortOrder.value === 'desc'
                ? (bValue as number) - (aValue as number)
                : (aValue as number) - (bValue as number)
        }
    })

    return students
})

const classAverage = computed(() => {
    if (!classInfo.value) return 0
    const total = classInfo.value.students.reduce((sum, student) => sum + student.totalScore, 0)
    return classInfo.value.students.length > 0 ? total / classInfo.value.students.length : 0
})

const totalScores = computed(() => {
    if (!classInfo.value) return 0
    return classInfo.value.students.reduce((sum, student) => sum + student.scores.length, 0)
})

const topStudent = computed(() => {
    if (!classInfo.value) return null
    return classInfo.value.students.reduce(
        (top, student) => (student.totalScore > (top?.totalScore || -Infinity) ? student : top),
        null as Student | null,
    )
})

const bottomStudent = computed(() => {
    if (!classInfo.value) return null
    return classInfo.value.students.reduce(
        (bottom, student) =>
            student.totalScore < (bottom?.totalScore || Infinity) ? student : bottom,
        null as Student | null,
    )
})

const highestScore = computed(() => topStudent.value?.totalScore || 0)
const lowestScore = computed(() => bottomStudent.value?.totalScore || 0)

const passRate = computed(() => {
    if (!classInfo.value) return 0
    const passCount = classInfo.value.students.filter((s) => s.totalScore >= 60).length
    return classInfo.value.students.length > 0
        ? Math.round((passCount / classInfo.value.students.length) * 100)
        : 0
})

const scoreRanges = computed(() => {
    const ranges = [
        { label: '90-100', min: 90, max: 100 },
        { label: '80-89', min: 80, max: 89 },
        { label: '70-79', min: 70, max: 79 },
        { label: '60-69', min: 60, max: 69 },
        { label: '0-59', min: 0, max: 59 },
    ]

    if (!classInfo.value) {
        return ranges.map((range) => ({ ...range, count: 0 }))
    }

    return ranges.map((range) => ({
        ...range,
        count: classInfo.value!.students.filter(
            (s) => s.totalScore >= range.min && s.totalScore <= range.max,
        ).length,
    }))
})

const categoryStats = computed(() => {
    if (!classInfo.value) return []
    return scoreCategories.map((category) => {
        const categoryScores = classInfo.value!.students.flatMap((student) =>
            student.scores
                .filter((score) => score.categoryId === category.id)
                .map((score) => score.value),
        )

        const total = categoryScores.reduce((sum, score) => sum + score, 0)
        const average = categoryScores.length > 0 ? total / categoryScores.length : 0

        return {
            categoryId: category.id,
            categoryName: category.name,
            total,
            average,
            count: categoryScores.length,
        }
    })
})

// Methods
const getCategoryScore = (student: Student, categoryId: string) => {
    const categoryScores = student.scores
        .filter((score) => score.categoryId === categoryId)
        .map((score) => score.value)

    return categoryScores.reduce((sum, score) => sum + score, 0)
}

const getCategoryCount = (student: Student, categoryId: string) => {
    return student.scores.filter((score) => score.categoryId === categoryId).length
}

const getCategoryName = (categoryId: string) => {
    return scoreCategories.find((c) => c.id === categoryId)?.name || '未知'
}

const getCategoryColor = (categoryId: string) => {
    return scoreCategories.find((c) => c.id === categoryId)?.color || '#666'
}

const getTrend = (student: Student) => {
    if (student.scores.length < 2) return 'stable'

    const recentScores = student.scores.slice(-5).map((s) => s.value)
    const firstHalf = recentScores.slice(0, Math.ceil(recentScores.length / 2))
    const secondHalf = recentScores.slice(Math.ceil(recentScores.length / 2))

    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length

    if (secondAvg > firstAvg + 0.5) return 'improving'
    if (secondAvg < firstAvg - 0.5) return 'declining'
    return 'stable'
}

const getTrendText = (trend: string) => {
    const trendTexts = {
        improving: '上升',
        declining: '下降',
        stable: '穩定',
    }
    return trendTexts[trend as keyof typeof trendTexts] || '穩定'
}

const getTrendBadgeClass = (trend: string) => {
    const classes = {
        improving: 'badge badge-success badge-sm',
        declining: 'badge badge-error badge-sm',
        stable: 'badge badge-neutral badge-sm',
    }
    return classes[trend as keyof typeof classes] || 'badge badge-neutral badge-sm'
}

const getRowClass = (student: Student, index: number) => {
    const classes = []

    if (index < 3) classes.push('bg-warning/10')
    if (!student.isPresent) classes.push('opacity-60')

    return classes.join(' ')
}

const getStudentRanking = (studentId: string) => {
    if (!classInfo.value) return 0
    const sorted = [...classInfo.value.students].sort((a, b) => b.totalScore - a.totalScore)
    return sorted.findIndex((s) => s.id === studentId) + 1
}

const viewStudentDetail = (studentId: string) => {
    if (!classInfo.value) return
    selectedStudentForDetail.value =
        classInfo.value.students.find((s) => s.id === studentId) || null
    detailModal.value?.showModal()
}

const closeDetailModal = () => {
    detailModal.value?.close()
    selectedStudentForDetail.value = null
}

const exportGradeReport = () => {
    if (!classInfo.value || !topStudent.value || !bottomStudent.value) return
    const content = [
        `${classInfo.value.name} 成績報告`,
        `匯出時間：${new Date().toLocaleString('zh-TW')}`,
        '',
        '班級統計：',
        `平均分：${classAverage.value.toFixed(1)}`,
        `最高分：${highestScore.value} (${topStudent.value.name})`,
        `最低分：${lowestScore.value} (${bottomStudent.value.name})`,
        `及格率：${passRate.value}%`,
        '',
        '學生成績：',
        '排名\t座號\t姓名\t總分\t平均分',
        ...sortedStudents.value.map(
            (student, index) =>
                `${index + 1}\t${student.id}\t${student.name}\t${student.totalScore}\t${student.averageScore.toFixed(1)}`,
        ),
    ].join('\n')

    reportTitle.value = '班級成績報告'
    reportContent.value = content
    reportModal.value?.showModal()
}

const exportStudentGrade = (studentId: string) => {
    if (!classInfo.value) return
    const student = classInfo.value.students.find((s) => s.id === studentId)
    if (!student) return

    const ranking = getStudentRanking(studentId)

    const content = [
        `個人成績報告`,
        `學生：${student.name} (座號 ${student.id})`,
        `班級：${classInfo.value.name}`,
        `匯出時間：${new Date().toLocaleString('zh-TW')}`,
        '',
        '成績概要：',
        `總分：${student.totalScore}`,
        `平均分：${student.averageScore.toFixed(1)}`,
        `班級排名：第 ${ranking} 名`,
        `評分記錄：${student.scores.length} 次`,
        '',
        '各類別得分：',
        ...scoreCategories.map(
            (category) =>
                `${category.name}：${getCategoryScore(student, category.id)} 分 (${getCategoryCount(student, category.id)} 次記錄)`,
        ),
        '',
        '評分記錄：',
        ...student.scores
            .slice()
            .reverse()
            .map(
                (score) =>
                    `${formatDateTime(score.timestamp)} - ${score.categoryName}: ${score.value > 0 ? '+' : ''}${score.value} ${score.reason ? `(${score.reason})` : ''}`,
            ),
    ].join('\n')

    reportTitle.value = `${student.name} 的成績報告`
    reportContent.value = content
    reportModal.value?.showModal()
}

const showStatisticsChart = () => {
    chartModal.value?.showModal()
}

const closeReportModal = () => {
    reportModal.value?.close()
}

const closeChartModal = () => {
    chartModal.value?.close()
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
</script>
