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
            <div
                v-if="visibleHomeworks.length > 0"
                class="mt-4 overflow-x-auto glass-card p-4 rounded-xl"
            >
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
                        <tr v-for="hw in visibleHomeworks" :key="hw.id">
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
import { computed, onMounted } from 'vue'
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

const getHomeworkSettings = (homeworkId: string) => {
    return classInfo.value?.homeworkSettings.find((s) => s.homeworkId === homeworkId)
}

const getHomeworkStatus = (homeworkId: string) => {
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
