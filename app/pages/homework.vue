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

        <!-- 篩選與操作 -->
        <div class="flex justify-end items-center mb-4">
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
                        <th>作業名稱</th>
                        <th>建立日期</th>
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
                                <button class="btn btn-ghost btn-sm" @click="openHomeworkModal(hw)">
                                    <LucideIcon name="Edit" class="w-4 h-4" />
                                </button>
                                <button
                                    class="btn btn-ghost btn-sm"
                                    @click="homeworkStore.toggleArchive(hw.id)"
                                >
                                    <LucideIcon
                                        :name="hw.isArchived ? 'ArchiveRestore' : 'Archive'"
                                        class="w-4 h-4"
                                    />
                                </button>
                                <button
                                    class="btn btn-ghost btn-sm text-error"
                                    @click="handleDelete(hw.id)"
                                >
                                    <LucideIcon name="Trash2" class="w-4 h-4" />
                                </button>
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
        <div class="modal" :class="{ 'modal-open': isModalOpen }">
            <div class="modal-box">
                <h3 class="font-bold text-lg">{{ isEditing ? '編輯作業' : '新增作業' }}</h3>
                <form @submit.prevent="handleSave">
                    <div class="form-control py-4">
                        <label class="label">
                            <span class="label-text">作業名稱</span>
                        </label>
                        <input
                            type="text"
                            v-model="editableHomework.name"
                            placeholder="請輸入作業名稱"
                            class="input input-bordered w-full"
                            required
                        />
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">備註 (選填)</span>
                        </label>
                        <textarea
                            v-model="editableHomework.notes"
                            class="textarea textarea-bordered h-24"
                            placeholder="請輸入備註內容"
                        ></textarea>
                    </div>
                    <div class="form-control py-4">
                        <label class="label">
                            <span class="label-text">對以下班級隱藏 (可多選)</span>
                        </label>
                        <div class="p-2 border rounded-lg bg-base-200 max-h-40 overflow-y-auto">
                            <div
                                v-for="classInfo in classesStore.classes"
                                :key="classInfo.id"
                                class="form-control"
                            >
                                <label class="label cursor-pointer">
                                    <span class="label-text">{{ classInfo.name }}</span>
                                    <input
                                        type="checkbox"
                                        :value="classInfo.id"
                                        v-model="editableHomework.hiddenFromClassIds"
                                        class="checkbox checkbox-primary"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-action">
                        <button type="button" class="btn" @click="closeHomeworkModal">取消</button>
                        <button type="submit" class="btn btn-primary">儲存</button>
                    </div>
                </form>
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

const filteredHomeworkList = computed(() => {
    return homeworkStore.homeworkList.filter((hw) => hw.isArchived === showArchived.value)
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
