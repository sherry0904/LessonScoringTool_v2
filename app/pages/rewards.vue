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
                    class="p-3 rounded-lg bg-base-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:scale-[1.02] flex flex-col"
                    :class="{ 'ring-2 ring-primary': draggedTemplate?.id === template.id }"
                >
                    <!-- 標題列 -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex-1">
                            <span class="font-semibold text-sm">{{ template.name }}</span>
                            <div class="flex items-center gap-1 mt-1">
                                <span v-if="template.isDefault" class="badge badge-xs badge-primary"
                                    >預設</span
                                >
                            </div>
                        </div>
                        <!-- 動作按鈕 -->
                        <div class="flex gap-1 flex-shrink-0 items-center">
                            <div class="tooltip tooltip-left" data-tip="編輯這個範本">
                                <button
                                    @click="editTemplate(template)"
                                    class="btn btn-xs btn-ghost"
                                >
                                    <LucideIcon name="Edit2" class="w-3 h-3" />
                                </button>
                            </div>
                            <div
                                v-if="
                                    !template.isDefault ||
                                    rewardsStore.rewardTemplates.filter((t) => t.isDefault).length >
                                        1
                                "
                                class="tooltip tooltip-left"
                                :data-tip="template.isDefault ? '刪除此預設範本' : '刪除這個範本'"
                            >
                                <button
                                    @click="deleteTemplate(template.id)"
                                    class="btn btn-xs btn-ghost text-error"
                                >
                                    <LucideIcon name="Trash2" class="w-3 h-3" />
                                </button>
                            </div>
                            <!-- Grip handle -->
                            <div class="tooltip tooltip-left" data-tip="拖曳此範本套用到班級">
                                <div class="w-4 h-4 flex items-center justify-center opacity-40">
                                    <LucideIcon name="GripVertical" class="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 設定資訊 -->
                    <div class="text-xs space-y-1 text-base-content/70">
                        <div>
                            💰 每星需求：<span class="font-semibold">{{
                                template.settings.pointsPerStar
                            }}</span>
                            分
                        </div>
                        <div>
                            ⭐ 達成無敵：<span class="font-semibold">{{
                                template.settings.starsToInvincible
                            }}</span>
                            星
                        </div>
                        <div>
                            ⏱️ 無敵時長：<span class="font-semibold">{{
                                formatDurationDisplay(template.settings.invincibleDurationSeconds)
                            }}</span>
                        </div>
                        <div>
                            🎯 無敵加分：<span class="font-semibold">{{
                                template.settings.invinciblePointsPerClick
                            }}</span>
                            分/次
                        </div>
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
            <!-- 頂部標題 -->
            <div class="p-4 sm:p-6 border-b bg-base-100 shrink-0">
                <PageHeader title="獎勵機制管理" description="管理班級的獎勵設定及範本套用。" />
            </div>

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
                    </div>

                    <!-- 批次操作列 -->
                    <div class="flex items-center gap-4">
                        <div v-if="selectedClassIds.length > 0" class="flex items-center gap-2">
                            <span class="text-sm text-base-content/70 badge badge-lg">
                                已選 {{ selectedClassIds.length }} 個班級
                            </span>
                            <button
                                @click="showBatchModal = true"
                                class="btn btn-primary btn-sm gap-2"
                            >
                                <LucideIcon name="Sparkles" class="w-4 h-4" />
                                批次套用
                            </button>
                            <button @click="selectedClassIds = []" class="btn btn-ghost btn-sm">
                                取消
                            </button>
                        </div>

                        <!-- 重設系統按鈕 -->
                        <button
                            @click="resetSystem"
                            class="btn btn-outline btn-error btn-sm gap-2"
                            title="重設所有獎勵範本到初始狀態"
                        >
                            <LucideIcon name="RefreshCw" class="w-4 h-4" />
                            重設回預設獎勵
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

        <!-- 確認對話 -->
        <ConfirmDialog
            ref="confirmDialogRef"
            :title="confirmDialogTitle"
            :message="confirmDialogMessage"
            confirm-text="確認"
            cancel-text="取消"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRewardsStore } from '~/stores/rewards'
import { useClassesStore } from '~/stores/classes'
import { useUIStore } from '~/stores/ui'
import type { ClassInfo, RewardTemplate, RewardSettings } from '~/types'
import { buildDefaultMilestoneMessages, formatDurationDisplay } from '~/constants/rewards'
import PageHeader from '~/components/PageHeader.vue'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

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

// 確認對話狀態
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null)
const pendingAction = ref<(() => void) | null>(null)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const activeClassesInGrouping = ref<string[]>([])

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

// 檢查班級是否在活動進行中
const isClassActive = (classId: string): boolean => {
    const cls = classesStore.classes.find((c) => c.id === classId)
    return cls?.groupingActive || false
}

// 檢查多個班級中是否有在活動進行中
const getActiveClassesFromList = (classIds: string[]): string[] => {
    return classIds.filter((id) => isClassActive(id))
}

// 顯示確認對話
const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    confirmDialogTitle.value = title
    confirmDialogMessage.value = message
    pendingAction.value = onConfirm
    confirmDialogRef.value?.open()
}

// 確認對話確認按鈕處理
const handleConfirm = () => {
    if (pendingAction.value) {
        pendingAction.value()
        pendingAction.value = null
    }
}

// 確認對話取消按鈕處理
const handleCancel = () => {
    pendingAction.value = null
    draggedTemplate.value = null
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
        const templateName = draggedTemplate.value.name
        const templateId = draggedTemplate.value.id
        const className = cls?.name || '此班級'

        // 檢查班級是否在活動進行中
        if (isClassActive(classId)) {
            showConfirmDialog(
                '活動進行中',
                `班級「${className}」目前有活動進行中。\n\n改變獎勵範本可能導致分數計算失準。\n\n確定要套用「${templateName}」嗎？`,
                () => {
                    const success = classesStore.applyTemplateToClass(
                        classId,
                        templateId,
                    )
                    if (success) {
                        uiStore.showSuccess(`已套用「${templateName}」到班級「${className}」`)
                    } else {
                        uiStore.showError('套用範本失敗')
                    }
                    draggedTemplate.value = null
                },
            )
        } else {
            const success = classesStore.applyTemplateToClass(classId, templateId)
            if (success) {
                uiStore.showSuccess(`已套用「${templateName}」到班級「${className}」`)
            } else {
                uiStore.showError('套用範本失敗')
            }
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
    const cls = classesStore.classes.find((c) => c.id === config.classId)
    const className = cls?.name || '此班級'
    const isActive = isClassActive(config.classId)

    const performSave = () => {
        let success = false

        if (config.mode === 'disabled') {
            success = classesStore.setRewardSettingsMode(config.classId, 'disabled')
        } else if (config.mode === 'template' && config.templateId) {
            success = classesStore.applyTemplateToClass(config.classId, config.templateId)
        }

        if (success) {
            uiStore.showSuccess('班級獎勵設定已更新')
            closeDrawer()
        } else {
            uiStore.showError('更新設定失敗，請稍後再試')
        }
    }

    // 檢查班級是否在活動進行中且要改變範本
    if (isActive && config.mode === 'template') {
        showConfirmDialog(
            '活動進行中',
            `班級「${className}」目前有活動進行中。\n\n改變獎勵範本可能導致分數計算失準。\n\n確定要改變設定嗎？`,
            performSave,
        )
    } else {
        performSave()
    }
}

// 批次套用
const closeBatchModal = () => {
    showBatchModal.value = false
    batchTemplateId.value = ''
}

const applyBatchTemplate = () => {
    if (!batchTemplateId.value) return

    const activeClasses = getActiveClassesFromList(selectedClassIds.value)
    const template = rewardsStore.getTemplateById(batchTemplateId.value)

    const performApply = () => {
        const success = classesStore.applyTemplateToMultipleClasses(
            batchTemplateId.value,
            selectedClassIds.value,
        )

        if (success) {
            uiStore.showSuccess(
                `已套用「${template?.name}」至 ${selectedClassIds.value.length} 個班級`,
            )
            selectedClassIds.value = []
            closeBatchModal()
        } else {
            uiStore.showError('套用範本失敗，請稍後再試')
        }
    }

    // 如果有班級在活動進行中，顯示警告
    if (activeClasses.length > 0) {
        const activeClassNames = activeClasses
            .map((id) => classesStore.classes.find((c) => c.id === id)?.name)
            .filter(Boolean)
            .join('、')

        showConfirmDialog(
            '有班級正在活動中',
            `以下班級正在活動進行中：${activeClassNames}\n\n改變獎勵範本可能導致分數計算失準。\n\n確定要套用「${template?.name}」至所有選定班級嗎？`,
            performApply,
        )
    } else {
        performApply()
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

const resetSystem = () => {
    if (
        confirm(
            '確定要重設系統嗎？\n\n這將：\n• 清除所有自訂獎勵範本\n• 將所有班級設定回到預設範本\n• 回到初始狀態\n\n此動作無法復原！',
        )
    ) {
        rewardsStore.resetToDefault()
        classesStore.resetAllClassesToDefault()
        selectedClassIds.value = []
        uiStore.showSuccess('系統已重設到初始狀態，所有班級已回到預設範本')
    }
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
