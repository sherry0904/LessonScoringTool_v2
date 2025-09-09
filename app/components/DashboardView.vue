<template>
    <div class="space-y-6">
        <!-- 歡迎區域 -->
        <div class="glass-card p-6 rounded-2xl">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gradient mb-2">歡迎回來！</h1>
                    <p class="text-base-content/70">
                        今天是 {{ formatDate(new Date()) }}，讓我們開始精彩的課堂吧！
                    </p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="stats shadow">
                        <div class="stat">
                            <div class="stat-figure text-primary">
                                <LucideIcon name="Users" class="w-8 h-8" />
                            </div>
                            <div class="stat-title">出席學生</div>
                            <div class="stat-value text-primary">
                                {{ classStore.presentStudents.length }}
                            </div>
                            <div class="stat-desc">共 {{ classStore.totalStudents }} 人</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 快速操作 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
                v-for="action in quickActions"
                :key="action.id"
                @click="handleQuickAction(action.id)"
                class="glass-card p-6 rounded-xl hover-lift cursor-pointer group"
            >
                <div class="flex items-center space-x-4">
                    <div
                        :class="[
                            'w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300',
                            action.color,
                            'group-hover:scale-110',
                        ]"
                    >
                        <LucideIcon :name="action.icon" class="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 class="font-semibold text-base-content">{{ action.title }}</h3>
                        <p class="text-sm text-base-content/60">{{ action.subtitle }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 課堂狀態與分組控制 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 分組狀態 -->
            <div class="glass-card p-6 rounded-xl">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-base-content">分組狀態</h2>
                    <div
                        :class="[
                            'badge',
                            classStore.isGroupingActive ? 'badge-success' : 'badge-neutral',
                        ]"
                    >
                        {{ classStore.isGroupingActive ? '進行中' : '未開始' }}
                    </div>
                </div>

                <div v-if="!classStore.isGroupingActive" class="space-y-4">
                    <p class="text-base-content/70">目前沒有進行分組活動</p>
                    <button
                        @click="startGrouping"
                        class="btn btn-primary btn-block"
                        :disabled="classStore.presentStudents.length === 0"
                    >
                        <LucideIcon name="Play" class="w-4 h-4 mr-2" />
                        開始此次課堂分組
                    </button>
                </div>

                <div v-else class="space-y-4">
                    <div class="flex items-center space-x-2">
                        <LucideIcon name="Clock" class="w-4 h-4 text-primary" />
                        <span class="text-sm text-base-content/70">
                            已進行 {{ classStore.groupingDuration }} 分鐘
                        </span>
                    </div>

                    <div class="space-y-2">
                        <div
                            v-for="group in classStore.groups"
                            :key="group.id"
                            class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                        >
                            <div class="flex items-center space-x-3">
                                <div
                                    class="w-4 h-4 rounded-full"
                                    :style="{ backgroundColor: group.color }"
                                ></div>
                                <span class="font-medium">{{ group.name }}</span>
                                <span class="text-sm text-base-content/60">
                                    {{ group.studentIds.length }} 人
                                </span>
                            </div>
                        </div>
                    </div>

                    <button @click="endGrouping" class="btn btn-error btn-block">
                        <LucideIcon name="Square" class="w-4 h-4 mr-2" />
                        結束此次課堂分組
                    </button>
                </div>
            </div>

            <!-- 今日表現 -->
            <div class="glass-card p-6 rounded-xl">
                <h2 class="text-xl font-bold text-base-content mb-4">今日表現</h2>

                <div v-if="classStore.students.length === 0" class="text-center py-8">
                    <LucideIcon
                        name="UserPlus"
                        class="w-12 h-12 text-base-content/30 mx-auto mb-4"
                    />
                    <p class="text-base-content/70">還沒有學生資料</p>
                    <button
                        @click="ui.setCurrentTab('students')"
                        class="btn btn-primary btn-sm mt-2"
                    >
                        新增學生
                    </button>
                </div>

                <div v-else class="space-y-3">
                    <div
                        v-for="student in topPerformersToday"
                        :key="student.id"
                        class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                    >
                        <div class="flex items-center space-x-3">
                            <div class="avatar placeholder">
                                <div class="bg-primary text-primary-content rounded-full w-8">
                                    <span class="text-xs">{{ student.name.charAt(0) }}</span>
                                </div>
                            </div>
                            <div>
                                <div class="font-medium">{{ student.name }}</div>
                                <div class="text-sm text-base-content/60">
                                    座號 {{ student.number }}
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-primary">
                                {{ getStudentTodayScore(student) }} 分
                            </div>
                            <div class="text-xs text-base-content/60">
                                {{ getStudentTodayScoreCount(student) }} 次評分
                            </div>
                        </div>
                    </div>

                    <button
                        @click="ui.setCurrentTab('statistics')"
                        class="btn btn-ghost btn-sm btn-block mt-4"
                    >
                        查看完整統計
                    </button>
                </div>
            </div>
        </div>

        <!-- 最近活動 -->
        <div class="glass-card p-6 rounded-xl">
            <h2 class="text-xl font-bold text-base-content mb-4">最近活動</h2>

            <div v-if="recentActivities.length === 0" class="text-center py-8">
                <LucideIcon name="Activity" class="w-12 h-12 text-base-content/30 mx-auto mb-4" />
                <p class="text-base-content/70">還沒有活動記錄</p>
            </div>

            <div v-else class="space-y-3">
                <div
                    v-for="activity in recentActivities"
                    :key="activity.id"
                    class="flex items-center space-x-4 p-3 hover:bg-base-200 rounded-lg transition-colors"
                >
                    <div
                        :class="[
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            getActivityColor(activity.type),
                        ]"
                    >
                        <LucideIcon
                            :name="getActivityIcon(activity.type)"
                            class="w-5 h-5 text-white"
                        />
                    </div>
                    <div class="flex-1">
                        <div class="font-medium">{{ activity.title }}</div>
                        <div class="text-sm text-base-content/60">{{ activity.description }}</div>
                    </div>
                    <div class="text-sm text-base-content/60">
                        {{ formatTimeAgo(activity.timestamp) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Student } from '~/types'

const classStore = useClassStore()
const ui = useUIStore()

// 快速操作
const quickActions = [
    {
        id: 'add-student',
        title: '新增學生',
        subtitle: '管理班級名單',
        icon: 'UserPlus',
        color: 'bg-blue-500',
    },
    {
        id: 'quick-score',
        title: '快速評分',
        subtitle: '為學生評分',
        icon: 'Star',
        color: 'bg-yellow-500',
    },
    {
        id: 'random-group',
        title: '隨機分組',
        subtitle: '自動分配小組',
        icon: 'Shuffle',
        color: 'bg-green-500',
    },
    {
        id: 'export-data',
        title: '匯出資料',
        subtitle: '下載學習記錄',
        icon: 'Download',
        color: 'bg-purple-500',
    },
]

// 計算今日最佳表現學生
const topPerformersToday = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return classStore.students
        .filter((student) => student.isPresent)
        .map((student) => ({
            ...student,
            todayScore: student.scores
                .filter((score) => new Date(score.timestamp) >= today)
                .reduce((sum, score) => sum + score.score, 0),
        }))
        .sort((a, b) => b.todayScore - a.todayScore)
        .slice(0, 5)
})

// 取得學生今日總分
const getStudentTodayScore = (student: Student) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return student.scores
        .filter((score) => new Date(score.timestamp) >= today)
        .reduce((sum, score) => sum + score.score, 0)
}

// 取得學生今日評分次數
const getStudentTodayScoreCount = (student: Student) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return student.scores.filter((score) => new Date(score.timestamp) >= today).length
}

// 最近活動（模擬資料）
const recentActivities = computed(() => {
    const activities = []

    // 從學生評分記錄產生活動
    classStore.students.forEach((student) => {
        student.scores.slice(-3).forEach((score) => {
            activities.push({
                id: `score-${score.id}`,
                type: 'score',
                title: `${student.name} 獲得評分`,
                description: `${score.category.name}: ${score.score} 分`,
                timestamp: score.timestamp,
            })
        })
    })

    // 分組活動
    if (classStore.isGroupingActive && classStore.groupingStartTime) {
        activities.push({
            id: 'grouping-start',
            type: 'grouping',
            title: '開始分組活動',
            description: `建立了 ${classStore.groups.length} 個小組`,
            timestamp: classStore.groupingStartTime,
        })
    }

    return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
})

// 處理快速操作
const handleQuickAction = (actionId: string) => {
    switch (actionId) {
        case 'add-student':
            ui.setCurrentTab('students')
            ui.openModal({
                id: 'add-student',
                title: '新增學生',
                size: 'md',
            })
            break

        case 'quick-score':
            ui.setCurrentTab('students')
            break

        case 'random-group':
            if (classStore.presentStudents.length < 2) {
                ui.showWarning('分組失敗', '至少需要 2 名出席學生才能進行分組')
                return
            }

            const groupCount = Math.ceil(classStore.presentStudents.length / 4) // 每組約 4 人
            classStore.randomAssignGroups(groupCount)
            ui.showSuccess('分組完成', `已建立 ${groupCount} 個小組`)
            ui.setCurrentTab('grouping')
            break

        case 'export-data':
            classStore.exportData()
            ui.showSuccess('匯出成功', '資料已下載至您的裝置')
            break
    }
}

// 開始分組
const startGrouping = () => {
    classStore.startGrouping()
    ui.showSuccess('分組開始', '您現在可以建立小組並指派學生')
}

// 結束分組
const endGrouping = () => {
    classStore.endGrouping()
    ui.showInfo('分組結束', `本次分組活動持續了 ${classStore.groupingDuration} 分鐘`)
}

// 取得活動圖示
const getActivityIcon = (type: string) => {
    const icons = {
        score: 'Star',
        grouping: 'Users',
        student: 'UserPlus',
        export: 'Download',
    }
    return icons[type] || 'Activity'
}

// 取得活動顏色
const getActivityColor = (type: string) => {
    const colors = {
        score: 'bg-yellow-500',
        grouping: 'bg-blue-500',
        student: 'bg-green-500',
        export: 'bg-purple-500',
    }
    return colors[type] || 'bg-gray-500'
}

// 日期格式化
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    }).format(date)
}

// 時間距離格式化
const formatTimeAgo = (date: Date | string) => {
    const now = new Date()
    const time = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return '剛剛'
    if (diffInMinutes < 60) return `${diffInMinutes} 分鐘前`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} 小時前`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} 天前`
}
</script>
