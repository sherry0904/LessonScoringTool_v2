<template>
    <div
        :class="[
            'glass-card p-6 rounded-xl hover-lift transition-all duration-300',
            !student.isPresent && 'opacity-60',
        ]"
    >
        <!-- 學生頭像和基本資訊 -->
        <div class="flex items-center space-x-4 mb-4">
            <div class="relative">
                <div class="avatar placeholder">
                    <div
                        :class="[
                            'rounded-full w-12',
                            student.isPresent
                                ? 'bg-primary text-primary-content'
                                : 'bg-gray-400 text-white',
                        ]"
                    >
                        <span class="text-lg font-semibold">{{ student.name.charAt(0) }}</span>
                    </div>
                </div>
                <!-- 出席狀態指示器 -->
                <div
                    :class="[
                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                        student.isPresent ? 'bg-success' : 'bg-error',
                    ]"
                ></div>
            </div>

            <div class="flex-1">
                <h3 class="font-bold text-lg text-base-content">{{ student.name }}</h3>
                <p class="text-sm text-base-content/60">座號 {{ student.number }}</p>
                <div v-if="student.group" class="badge badge-outline badge-sm mt-1">
                    {{ student.group }}
                </div>
            </div>

            <!-- 操作選單 -->
            <div class="dropdown dropdown-left">
                <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                    <LucideIcon name="MoreVertical" class="w-4 h-4" />
                </label>
                <ul
                    tabindex="0"
                    class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                    <li>
                        <a @click="$emit('score', student)">
                            <LucideIcon name="Star" class="w-4 h-4" />
                            評分
                        </a>
                    </li>
                    <li>
                        <a @click="$emit('toggle-attendance', student.id)">
                            <LucideIcon
                                :name="student.isPresent ? 'UserMinus' : 'UserCheck'"
                                class="w-4 h-4"
                            />
                            {{ student.isPresent ? '標記缺席' : '標記出席' }}
                        </a>
                    </li>
                    <li>
                        <a @click="$emit('edit', student)">
                            <LucideIcon name="Edit" class="w-4 h-4" />
                            編輯資料
                        </a>
                    </li>
                    <div class="divider my-1"></div>
                    <li>
                        <a @click="$emit('delete', student.id)" class="text-error">
                            <LucideIcon name="Trash2" class="w-4 h-4" />
                            刪除學生
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- 成績統計 -->
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/70">平均分數</span>
                <div class="flex items-center space-x-2">
                    <span :class="['text-lg font-bold', getScoreColor(averageScore)]">
                        {{ averageScore.toFixed(1) }}
                    </span>
                    <div class="text-xs text-base-content/50">/10</div>
                </div>
            </div>

            <!-- 成績進度條 -->
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                    :class="[
                        'h-2 rounded-full transition-all duration-500',
                        getScoreProgressColor(averageScore),
                    ]"
                    :style="{ width: `${(averageScore / 10) * 100}%` }"
                ></div>
            </div>

            <!-- 評分統計 -->
            <div class="flex items-center justify-between text-sm">
                <span class="text-base-content/70">評分次數</span>
                <span class="font-medium">{{ student.scores.length }} 次</span>
            </div>

            <!-- 最近評分 -->
            <div v-if="latestScore" class="text-sm">
                <span class="text-base-content/70">最近評分：</span>
                <span :class="['font-medium ml-1', getScoreColor(latestScore.score)]">
                    {{ latestScore.category.name }} {{ latestScore.score }} 分
                </span>
                <div class="text-xs text-base-content/50 mt-1">
                    {{ formatTimeAgo(latestScore.timestamp) }}
                </div>
            </div>

            <div v-else class="text-sm text-base-content/50">尚未評分</div>
        </div>

        <!-- 類別統計 -->
        <div v-if="student.scores.length > 0" class="mt-4 pt-4 border-t border-base-300">
            <div class="text-sm text-base-content/70 mb-2">各類別表現</div>
            <div class="grid grid-cols-2 gap-2">
                <div
                    v-for="category in categoryStats"
                    :key="category.id"
                    class="flex items-center space-x-2"
                >
                    <div
                        class="w-3 h-3 rounded-full"
                        :style="{ backgroundColor: category.color }"
                    ></div>
                    <span class="text-xs text-base-content/70 flex-1">
                        {{ category.name }}
                    </span>
                    <span class="text-xs font-medium">
                        {{ category.average.toFixed(1) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- 快速評分按鈕 -->
        <div class="mt-4 pt-4 border-t border-base-300">
            <button
                @click="$emit('score', student)"
                :class="[
                    'btn btn-block btn-sm',
                    student.isPresent ? 'btn-primary' : 'btn-disabled',
                ]"
                :disabled="!student.isPresent"
            >
                <LucideIcon name="Star" class="w-4 h-4 mr-2" />
                {{ student.isPresent ? '立即評分' : '學生缺席' }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Student, StudentScore, ScoreCategory } from '~/types'

interface Props {
    student: Student
}

const props = defineProps<Props>()

defineEmits<{
    score: [student: Student]
    edit: [student: Student]
    delete: [studentId: string]
    'toggle-attendance': [studentId: string]
}>()

const classStore = useClassStore()

// 計算屬性
const averageScore = computed(() => {
    if (props.student.scores.length === 0) return 0
    const total = props.student.scores.reduce((sum, score) => sum + score.score, 0)
    return total / props.student.scores.length
})

const latestScore = computed(() => {
    if (props.student.scores.length === 0) return null
    return [...props.student.scores].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0]
})

const categoryStats = computed(() => {
    const stats = classStore.settings.scoreCategories
        .map((category) => {
            const categoryScores = props.student.scores.filter(
                (score) => score.category.id === category.id,
            )

            const average =
                categoryScores.length > 0
                    ? categoryScores.reduce((sum, score) => sum + score.score, 0) /
                      categoryScores.length
                    : 0

            return {
                ...category,
                average,
                count: categoryScores.length,
            }
        })
        .filter((stat) => stat.count > 0)

    return stats
})

// 方法
const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success'
    if (score >= 6) return 'text-info'
    if (score >= 4) return 'text-warning'
    return 'text-error'
}

const getScoreProgressColor = (score: number) => {
    if (score >= 8) return 'bg-success'
    if (score >= 6) return 'bg-info'
    if (score >= 4) return 'bg-warning'
    return 'bg-error'
}

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
