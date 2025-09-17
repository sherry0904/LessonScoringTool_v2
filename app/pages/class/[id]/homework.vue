<template>
    <NuxtPage />
    <template v-if="route.name === 'class-id-homework'">
        <div v-if="classInfo" class="space-y-6">
            <div class="card bg-base-100 shadow-sm">
                <div class="card-body">
                    <div class="flex justify-between items-center">
                        <h3 class="card-title">作業列表</h3>
                        <button @click="showHomeworkModalForAdd" class="btn btn-primary gap-2">
                            <LucideIcon name="Plus" class="w-4 h-4" />
                            新增作業
                        </button>
                    </div>
                    <!-- 搜尋欄 -->
                    <div class="mt-4">
                        <input
                            v-model="searchText"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="搜尋作業名稱..."
                        />
                    </div>
                    <!-- 作業列表 -->
                    <div v-if="filteredHomeworks.length > 0" class="mt-4">
                        <div class="overflow-x-auto">
                            <table class="table w-full">
                                <thead>
                                    <tr>
                                        <th>名稱</th>
                                        <th>建立日期</th>
                                        <th>狀態統計</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="homework in pagedHomeworks" :key="homework.id">
                                        <td class="font-semibold">{{ homework.title }}</td>
                                        <td>{{ formatDate(homework.createdAt) }}</td>
                                        <td>
                                            <span
                                                v-for="status in statusOrder"
                                                :key="status"
                                                class="badge mr-1 min-w-[3em] justify-center text-white font-bold"
                                                :class="getStatusBadgeClass(status)"
                                            >
                                                {{ getStatusCount(homework, status) }}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                @click="goToHomeworkDetail(homework.id)"
                                                class="btn btn-sm btn-outline"
                                            >
                                                詳情
                                            </button>
                                            <button
                                                @click="showHomeworkModalForEdit(homework.id)"
                                                class="btn btn-sm btn-ghost"
                                            >
                                                <LucideIcon name="Edit" class="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!-- 分頁 -->
                        <div class="flex justify-end items-center mt-4 gap-2">
                            <button class="btn btn-sm" :disabled="page === 1" @click="page--">
                                上一頁
                            </button>
                            <span>第 {{ page }} 頁 / 共 {{ totalPages }} 頁</span>
                            <button
                                class="btn btn-sm"
                                :disabled="page === totalPages"
                                @click="page++"
                            >
                                下一頁
                            </button>
                        </div>
                    </div>
                    <div v-else class="text-center py-8 text-base-content/70">
                        還沒有作業，點擊上方按鈕新增第一個作業
                    </div>
                </div>
            </div>
            <!-- 新增/編輯作業模態 -->
            <dialog ref="homeworkModal" class="modal">
                <div class="modal-box">
                    <h3 class="text-lg font-bold mb-4">{{ modalTitle }}</h3>
                    <form @submit.prevent="handleHomeworkSubmit" class="space-y-4">
                        <div class="form-control">
                            <label class="label mr-2">
                                <span class="label-text">作業名稱</span>
                            </label>
                            <input
                                v-model="homeworkModalForm.title"
                                type="text"
                                placeholder="例如：數學習作 P.30-32"
                                class="input input-bordered"
                                required
                            />
                        </div>
                        <div class="modal-action">
                            <button type="button" @click="closeHomeworkModal" class="btn btn-ghost">
                                取消
                            </button>
                            <button type="submit" class="btn btn-primary">
                                {{ submitButtonText }}
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button @click="closeHomeworkModal">close</button>
                </form>
            </dialog>
        </div>
        <div v-else class="text-center p-8">
            <p>正在載入班級資料...</p>
            <span class="loading loading-lg loading-spinner text-primary"></span>
        </div>
    </template>
</template>

<script setup lang="ts">
import { useClassesStore } from '~/stores/classes'
import { useRoute, useRouter } from 'vue-router'
import type { ClassInfo, Homework } from '~/types'
import LucideIcon from '~/components/LucideIcon.vue'

const classesStore = useClassesStore()
const route = useRoute()
const router = useRouter()

const classId = computed(() => route.params.id as string)
const classInfo = computed(() => classesStore.classes.find((c) => c.id === classId.value))

// Modal refs
const homeworkModal = ref<HTMLDialogElement>()
const editingHomeworkId = ref<string | null>(null)
const homeworkModalForm = reactive({ title: '' })

// 搜尋、分頁
const searchText = ref('')
const page = ref(1)
const pageSize = 10

const statusOrder = ['pending', 'submitted', 'needs_correction', 'completed']
const statusText = {
    pending: { text: '未繳交' },
    submitted: { text: '已繳交' },
    needs_correction: { text: '待訂正' },
    completed: { text: '已完成' },
}

const filteredHomeworks = computed(() => {
    if (!classInfo.value) return []
    if (!searchText.value.trim()) return classInfo.value.homeworks
    return classInfo.value.homeworks.filter((hw) => hw.title.includes(searchText.value.trim()))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredHomeworks.value.length / pageSize)))
const pagedHomeworks = computed(() => {
    const start = (page.value - 1) * pageSize
    return filteredHomeworks.value.slice(start, start + pageSize)
})

const getStatusBadgeClass = (status: string) => {
    const classes = {
        pending: 'badge-error',
        submitted: 'badge-success',
        needs_correction: 'badge-warning',
        completed: 'badge-info',
    }
    return classes[status as keyof typeof classes] || 'badge-neutral'
}

const getStatusText = (status: string) => {
    return statusText[status as keyof typeof statusText]?.text || '未知'
}

const getStatusCount = (homework: Homework, status: string) => {
    if (!homework) return 0
    return Object.values(homework.studentStatus).filter((s) => s === status).length
}

const formatDate = (date: string | Date) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const goToHomeworkDetail = (hwid: string) => {
    router.push({ path: `/class/${classId.value}/homework/${hwid}` })
}

const isEditing = computed(() => editingHomeworkId.value !== null)
const modalTitle = computed(() => (isEditing.value ? '編輯作業' : '新增作業'))
const submitButtonText = computed(() => (isEditing.value ? '更新' : '新增'))

const showHomeworkModalForAdd = () => {
    editingHomeworkId.value = null
    homeworkModalForm.title = ''
    homeworkModal.value?.showModal()
}

const showHomeworkModalForEdit = (homeworkId: string) => {
    const homeworkToEdit = classInfo.value?.homeworks.find((h) => h.id === homeworkId)
    if (homeworkToEdit) {
        editingHomeworkId.value = homeworkId
        homeworkModalForm.title = homeworkToEdit.title
        homeworkModal.value?.showModal()
    }
}

const closeHomeworkModal = () => {
    homeworkModal.value?.close()
}

const addHomework = () => {
    if (!homeworkModalForm.title.trim() || !classInfo.value) return
    classesStore.addHomework(classInfo.value.id, homeworkModalForm.title)
    closeHomeworkModal()
}

const updateHomework = () => {
    if (!editingHomeworkId.value || !homeworkModalForm.title.trim() || !classInfo.value) return
    classesStore.updateHomeworkTitle(
        classInfo.value.id,
        editingHomeworkId.value,
        homeworkModalForm.title,
    )
    closeHomeworkModal()
}

const handleHomeworkSubmit = () => {
    if (isEditing.value) {
        updateHomework()
    } else {
        addHomework()
    }
}

watch(searchText, () => {
    page.value = 1
})
watch(filteredHomeworks, () => {
    if (page.value > totalPages.value) page.value = totalPages.value
})
</script>
