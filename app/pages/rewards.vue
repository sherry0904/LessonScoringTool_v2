<template>
    <div class="flex h-[calc(100vh-4rem)] bg-base-100">
        <!-- 左側：範本庫（可摺疊） -->
        <aside
            class="w-80 border-r border-base-300 transition-all duration-300 flex flex-col"
            :class="{ '-ml-80': !showTemplates }"
        >
            <div class="p-4 border-b flex items-center justify-between bg-base-200/50">
                <h3 class="font-bold text-lg flex items-center gap-2">
                    <LucideIcon name="LayoutGrid" class="w-5 h-5" />
                    範本庫
                </h3>
                <button @click="showTemplates = false" class="btn btn-ghost btn-sm btn-circle">
                    <LucideIcon name="ChevronsLeft" class="w-4 h-4" />
                </button>
            </div>

            <!-- 範本卡片（可拖曳） -->
            <div class="p-4 space-y-2 overflow-y-auto flex-1">
                <div
                    v-for="template in rewardsStore.rewardTemplates"
                    :key="template.id"
                    draggable="true"
                    @dragstart="onDragTemplate($event, template)"
                    @dragend="draggedTemplate = null"
                    class="p-3 rounded-lg bg-base-200 cursor-move hover:shadow-md transition-all hover:scale-[1.02]"
                    :class="{ 'ring-2 ring-primary': draggedTemplate?.id === template.id }"
                >
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold text-sm">{{ template.name }}</span>
                        <div class="flex items-center gap-1">
                            <span v-if="template.isDefault" class="badge badge-xs badge-primary"
                                >預設</span
                            >
                            <LucideIcon name="GripVertical" class="w-4 h-4 opacity-40" />
                        </div>
                    </div>
                    <div class="text-xs space-y-1 text-base-content/70">
                        <div>⭐ {{ template.settings.starsToInvincible }}星→無敵</div>
                        <div>💰 {{ template.settings.pointsPerStar }}分=1星</div>
                        <div>⏱️ {{ template.settings.invincibleDurationSeconds }}秒</div>
                    </div>
                    <div class="mt-2 flex gap-1">
                        <button @click="editTemplate(template)" class="btn btn-xs btn-ghost flex-1">
                            <LucideIcon name="Edit2" class="w-3 h-3" />
                            編輯
                        </button>
                        <button
                            v-if="!template.isDefault"
                            @click="deleteTemplate(template.id)"
                            class="btn btn-xs btn-ghost text-error"
                        >
                            <LucideIcon name="Trash2" class="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            <div class="p-4 border-t">
                <button @click="createNewTemplate" class="btn btn-primary btn-sm btn-block gap-2">
                    <LucideIcon name="Plus" class="w-4 h-4" />
                    新增範本
                </button>
            </div>
        </aside>

        <!-- 右側：班級列表主區 -->
        <main class="flex-1 flex flex-col overflow-hidden">
            <!-- 頂部工具列 -->
            <div class="p-4 border-b bg-base-100 shrink-0">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button
                            v-if="!showTemplates"
                            @click="showTemplates = true"
                            class="btn btn-ghost btn-sm gap-2"
                        >
                            <LucideIcon name="LayoutGrid" class="w-4 h-4" />
                            範本庫
                        </button>

                        <h1 class="text-2xl font-bold">獎勵機制管理</h1>
                    </div>

                    <!-- 批次操作列 -->
                    <div v-if="selectedClassIds.length > 0" class="flex items-center gap-2">
                        <span class="text-sm text-base-content/70 badge badge-lg">
                            已選 {{ selectedClassIds.length }} 個班級
                        </span>
                        <button @click="showBatchModal = true" class="btn btn-primary btn-sm gap-2">
                            <LucideIcon name="Sparkles" class="w-4 h-4" />
                            批次套用
                        </button>
                        <button @click="selectedClassIds = []" class="btn btn-ghost btn-sm">
                            取消
                        </button>
                    </div>
                </div>
            </div>

            <!-- 班級表格 -->
            <div class="flex-1 overflow-auto p-4">
                <div class="card bg-base-100 shadow">
                    <div class="card-body p-0">
                        <table class="table table-zebra w-full">
                            <thead class="sticky top-0 bg-base-200 z-10">
                                <tr>
                                    <th class="w-12">
                                        <input
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                            :checked="isAllSelected"
                                            @change="toggleSelectAll"
                                        />
                                    </th>
                                    <th>班級</th>
                                    <th>目前獎勵設定</th>
                                    <th class="text-center">狀態</th>
                                    <th class="w-32 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="cls in classesStore.classes"
                                    :key="cls.id"
                                    @drop="onDropTemplate($event, cls.id)"
                                    @dragover.prevent
                                    @dragenter="onDragEnter(cls.id)"
                                    @dragleave="onDragLeave(cls.id)"
                                    class="hover:bg-base-200/50 transition-colors"
                                    :class="{ 'bg-primary/10': dragOverClassId === cls.id }"
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                            :checked="selectedClassIds.includes(cls.id)"
                                            @change="toggleClass(cls.id)"
                                        />
                                    </td>
                                    <td>
                                        <div class="font-semibold">{{ cls.name }}</div>
                                        <div
                                            class="text-xs text-base-content/60 flex items-center gap-1"
                                        >
                                            <LucideIcon name="Users" class="w-3 h-3" />
                                            {{ cls.students.length }} 人
                                        </div>
                                    </td>
                                    <td>
                                        <RewardBadge :class-info="cls" :show-details="true" />
                                    </td>
                                    <td class="text-center">
                                        <span
                                            v-if="cls.groupingActive"
                                            class="badge badge-success badge-sm gap-1"
                                        >
                                            <LucideIcon name="Play" class="w-3 h-3" />
                                            活動中
                                        </span>
                                        <span v-else class="badge badge-ghost badge-sm">
                                            待機中
                                        </span>
                                    </td>
                                    <td class="text-right">
                                        <button
                                            @click="openDrawer(cls)"
                                            class="btn btn-ghost btn-sm gap-1"
                                        >
                                            <LucideIcon name="Settings" class="w-4 h-4" />
                                            設定
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="classesStore.classes.length === 0">
                                    <td colspan="5" class="text-center text-base-content/50 py-12">
                                        <div class="flex flex-col items-center gap-2">
                                            <LucideIcon
                                                name="AlertCircle"
                                                class="w-8 h-8 opacity-40"
                                            />
                                            <p class="text-sm">尚無班級，請先在首頁新增班級</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>

        <!-- 側拉抽屜：班級獎勵設定 -->
        <Teleport to="body">
            <div v-if="drawerOpen" class="fixed inset-0 z-50 flex items-center justify-end">
                <!-- 背景遮罩 -->
                <div class="absolute inset-0 bg-black/50" @click="closeDrawer"></div>

                <!-- 抽屜內容 -->
                <div
                    class="relative w-[600px] h-full bg-base-100 shadow-2xl flex flex-col animate-slide-in-right"
                >
                    <!-- 抽屜標題 -->
                    <div class="p-6 border-b flex items-center justify-between shrink-0">
                        <div>
                            <h2 class="text-2xl font-bold">{{ selectedClass?.name }}</h2>
                            <p class="text-sm text-base-content/60 mt-1">獎勵機制設定</p>
                        </div>
                        <button @click="closeDrawer" class="btn btn-ghost btn-sm btn-circle">
                            <LucideIcon name="X" class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- 抽屜內容 -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <RewardSettingsForm
                            v-if="selectedClass"
                            :class-info="selectedClass"
                            :templates="rewardsStore.rewardTemplates"
                            @save="handleSave"
                            @cancel="closeDrawer"
                        />
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- 批次套用範本 Modal -->
        <dialog class="modal" :class="{ 'modal-open': showBatchModal }">
            <div class="modal-box max-w-md">
                <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                    <LucideIcon name="Sparkles" class="w-5 h-5" />
                    批次套用範本
                </h3>

                <div class="form-control mb-4">
                    <label class="label">
                        <span class="label-text">選擇範本</span>
                    </label>
                    <select v-model="batchTemplateId" class="select select-bordered">
                        <option value="">-- 請選擇範本 --</option>
                        <option
                            v-for="template in rewardsStore.rewardTemplates"
                            :key="template.id"
                            :value="template.id"
                        >
                            {{ template.name }}
                            <span v-if="template.isDefault"> (預設)</span>
                        </option>
                    </select>
                </div>

                <div class="alert alert-info mb-4">
                    <LucideIcon name="Info" class="w-5 h-5" />
                    <span class="text-sm">
                        將套用至 {{ selectedClassIds.length }} 個班級，修改將立即生效。
                    </span>
                </div>

                <div class="modal-action">
                    <button @click="closeBatchModal" class="btn btn-ghost">取消</button>
                    <button
                        @click="applyBatchTemplate"
                        class="btn btn-primary"
                        :disabled="!batchTemplateId"
                    >
                        確認套用
                    </button>
                </div>
            </div>
            <div class="modal-backdrop" @click="closeBatchModal"></div>
        </dialog>

        <!-- 範本編輯 Modal -->
        <RewardTemplateModal
            ref="templateModalRef"
            :initial-template="editingTemplate"
            :is-creating-new="isCreatingNew"
            :default-settings="defaultTemplateSettings"
            @save="handleTemplateSave"
            @cancel="handleTemplateCancel"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRewardsStore } from '~/stores/rewards'
import { useClassesStore } from '~/stores/classes'
import { useUIStore } from '~/stores/ui'
import type { ClassInfo, RewardTemplate, RewardSettings } from '~/types'
import { buildDefaultMilestoneMessages } from '~/constants/rewards'

definePageMeta({
    layout: 'default',
})

const rewardsStore = useRewardsStore()
const classesStore = useClassesStore()
const uiStore = useUIStore()

// UI 狀態
const showTemplates = ref(true)
const drawerOpen = ref(false)
const selectedClass = ref<ClassInfo | null>(null)
const selectedClassIds = ref<string[]>([])
const showBatchModal = ref(false)
const batchTemplateId = ref('')

// 拖曳狀態
const draggedTemplate = ref<RewardTemplate | null>(null)
const dragOverClassId = ref<string | null>(null)

// 範本編輯
const templateModalRef = ref<any>(null)
const editingTemplate = ref<RewardTemplate | null>(null)
const isCreatingNew = ref(false)
const defaultTemplateSettings = ref<RewardSettings>({
    enabled: true,
    pointsPerStar: 10,
    starsToInvincible: 3,
    invincibleDurationSeconds: 30,
    invinciblePointsPerClick: 5,
    milestoneMessages: buildDefaultMilestoneMessages(3),
})

// 全選邏輯
const isAllSelected = computed(() => {
    return (
        classesStore.classes.length > 0 &&
        selectedClassIds.value.length === classesStore.classes.length
    )
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedClassIds.value = []
    } else {
        selectedClassIds.value = classesStore.classes.map((c) => c.id)
    }
}

const toggleClass = (classId: string) => {
    const index = selectedClassIds.value.indexOf(classId)
    if (index > -1) {
        selectedClassIds.value.splice(index, 1)
    } else {
        selectedClassIds.value.push(classId)
    }
}

// 拖曳功能
const onDragTemplate = (event: DragEvent, template: RewardTemplate) => {
    draggedTemplate.value = template
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copy'
        event.dataTransfer.setData('text/plain', template.id)
    }
}

const onDragEnter = (classId: string) => {
    dragOverClassId.value = classId
}

const onDragLeave = (classId: string) => {
    if (dragOverClassId.value === classId) {
        dragOverClassId.value = null
    }
}

const onDropTemplate = (event: DragEvent, classId: string) => {
    event.preventDefault()
    dragOverClassId.value = null

    if (draggedTemplate.value) {
        const cls = classesStore.classes.find((c) => c.id === classId)
        const success = classesStore.applyTemplateToClass(classId, draggedTemplate.value.id)

        if (success) {
            uiStore.showSuccess(`已套用「${draggedTemplate.value.name}」到班級「${cls?.name}」`)
        } else {
            uiStore.showError('套用範本失敗')
        }

        draggedTemplate.value = null
    }
}

// 抽屜操作
const openDrawer = (cls: ClassInfo) => {
    selectedClass.value = cls
    drawerOpen.value = true
}

const closeDrawer = () => {
    drawerOpen.value = false
    setTimeout(() => {
        selectedClass.value = null
    }, 300)
}

const handleSave = (config: any) => {
    let success = false

    if (config.mode === 'disabled') {
        success = classesStore.setRewardSettingsMode(config.classId, 'disabled')
    } else if (config.mode === 'template' && config.templateId) {
        success = classesStore.applyTemplateToClass(config.classId, config.templateId)
    } else if (config.mode === 'custom' && config.settings) {
        success = classesStore.setCustomRewardSettings(config.classId, config.settings)
    }

    if (success) {
        uiStore.showSuccess('班級獎勵設定已更新')
        closeDrawer()
    } else {
        uiStore.showError('更新設定失敗，請稍後再試')
    }
}

// 批次套用
const closeBatchModal = () => {
    showBatchModal.value = false
    batchTemplateId.value = ''
}

const applyBatchTemplate = () => {
    if (!batchTemplateId.value) return

    const success = classesStore.applyTemplateToMultipleClasses(
        batchTemplateId.value,
        selectedClassIds.value,
    )

    if (success) {
        const template = rewardsStore.getTemplateById(batchTemplateId.value)
        uiStore.showSuccess(`已套用「${template?.name}」至 ${selectedClassIds.value.length} 個班級`)
        selectedClassIds.value = []
        closeBatchModal()
    } else {
        uiStore.showError('套用範本失敗，請稍後再試')
    }
}

// 範本管理
const createNewTemplate = () => {
    editingTemplate.value = null
    isCreatingNew.value = true
    templateModalRef.value?.open()
}

const editTemplate = (template: RewardTemplate) => {
    editingTemplate.value = template
    isCreatingNew.value = false
    templateModalRef.value?.open()
}

const deleteTemplate = (templateId: string) => {
    if (confirm('確定要刪除此範本嗎？')) {
        const success = rewardsStore.deleteTemplate(templateId)
        if (success) {
            uiStore.showSuccess('範本已刪除')
        } else {
            uiStore.showError('無法刪除預設範本')
        }
    }
}

const handleTemplateSave = (template: RewardTemplate, isNew: boolean) => {
    const shouldSetDefault = !!template.isDefault

    if (isNew) {
        const newTemplate = rewardsStore.addTemplate(template.name, template.settings)
        if (newTemplate) {
            if (shouldSetDefault) {
                rewardsStore.setDefaultTemplate(newTemplate.id)
                uiStore.showSuccess('範本已建立並設為預設')
            } else {
                uiStore.showSuccess('範本已建立')
            }
            editingTemplate.value = null
            isCreatingNew.value = false
        }
    } else {
        rewardsStore.updateTemplate(template.id, template)

        if (shouldSetDefault) {
            rewardsStore.setDefaultTemplate(template.id)
        } else {
            const currentDefaultId = rewardsStore.defaultTemplate?.id
            if (currentDefaultId === template.id) {
                const fallback = rewardsStore.rewardTemplates.find((t) => t.id !== template.id)
                if (fallback) {
                    rewardsStore.setDefaultTemplate(fallback.id)
                } else {
                    rewardsStore.setDefaultTemplate(template.id)
                }
            }
        }

        uiStore.showSuccess('範本已更新')
        editingTemplate.value = null
        isCreatingNew.value = false
    }
}

const handleTemplateCancel = () => {
    editingTemplate.value = null
    isCreatingNew.value = false
}
</script>

<style scoped>
@keyframes slide-in-right {
    from {
        transform: translateX(100%);
    }
    to {
        transform: translateX(0);
    }
}

.animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
}

/* 拖曳時的視覺效果 */
[draggable='true'] {
    user-select: none;
}

[draggable='true']:active {
    opacity: 0.5;
}
</style>
