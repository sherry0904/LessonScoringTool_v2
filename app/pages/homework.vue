<template>
    <div class="p-4 sm:p-6">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold">全域作業管理</h1>
            <button class="btn btn-primary" @click="openHomeworkModal()">
                <LucideIcon name="Plus" class="w-4 h-4" />
                新增作業
            </button>
        </div>
        <p class="mb-6 text-base-content/70">
            這裡是管理所有班級作業範本的地方。您可以在此建立、編輯、封存作業。
        </p>

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
            <div class="form-control">
                <label class="label cursor-pointer">
                    <span class="label-text mr-2">顯示已封存作業</span>
                    <input type="checkbox" v-model="showArchived" class="toggle toggle-primary" />
                </label>
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
                        <th class="text-right">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="hw in filteredHomeworkList" :key="hw.id">
                        <td>
                            <div class="font-bold">{{ hw.name }}</div>
                        </td>
                        <td>{{ new Date(hw.createdAt).toLocaleDateString() }}</td>
                        <td>{{ hw.notes }}</td>
                        <td>
                            <span v-if="hw.isArchived" class="badge badge-ghost">已封存</span>
                            <span v-else class="badge badge-success">啟用中</span>
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
                        <td colspan="5" class="text-center py-8">
                            <p class="text-base-content/60">
                                {{ showArchived ? '沒有已封存的作業' : '尚未建立任何作業範本' }}
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

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
                        <button type="button" class="btn btn-ghost" @click="closeHomeworkModal">取消</button>
                        <button type="submit" class="btn btn-primary">
                            {{ isEditing ? '儲存變更' : '確認新增' }}
                        </button>
                    </div>
                </form>
                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeHomeworkModal">✕</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useHomeworkStore } from '~/stores/homework'
import { useClassesStore } from '~/stores/classes'
import type { GlobalHomework } from '~/types/homework'

// SEO and other page settings
useHead({
    title: '全域作業管理',
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
