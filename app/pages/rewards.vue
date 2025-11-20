<template>
    <div class="flex h-[calc(100vh-4rem)] bg-base-100">
        <!-- 左側：範本庫（可摺疊） -->
        <aside
            class="w-80 border-r border-base-300 transition-all duration-300 flex flex-col"
            :class="{ '-ml-80': !showTemplates }"
        >
            <div class="p-4 border-b bg-base-200/50">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <LucideIcon name="LayoutGrid" class="w-5 h-5" />
                        範本庫
                    </h3>
                    <button @click="showTemplates = false" class="btn btn-ghost btn-sm btn-circle">
                        <LucideIcon name="ChevronsLeft" class="w-4 h-4" />
                    </button>
                </div>

                <!-- 模式類型 Tab (現代膠囊樣式) -->
                <div
                    role="tablist"
                    aria-label="範本庫模式切換"
                    class="grid grid-cols-2 items-center gap-2 bg-base-200/70 p-1 rounded-2xl"
                >
                    <button
                        type="button"
                        role="tab"
                        :aria-selected="selectedModeTab === 'class-total'"
                        class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
                        :class="{
                            'bg-base-100 text-primary shadow-[0_6px_18px_rgba(25,39,85,0.15)] border-primary/20':
                                selectedModeTab === 'class-total',
                            'text-base-content/60 hover:text-base-content hover:bg-base-100/70':
                                selectedModeTab !== 'class-total',
                        }"
                        @click="selectedModeTab = 'class-total'"
                    >
                        <LucideIcon name="Users" class="w-3.5 h-3.5" />
                        <span>全班協作</span>
                        <span
                            class="ml-1 inline-flex items-center justify-center min-w-[1.35rem] h-5 rounded-full bg-base-300 text-[11px] font-semibold text-base-content/80"
                        >
                            {{ classTotalTemplatesCount }}
                        </span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        :aria-selected="selectedModeTab === 'group-based'"
                        class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
                        :class="{
                            'bg-base-100 text-primary shadow-[0_6px_18px_rgba(25,39,85,0.15)] border-primary/20':
                                selectedModeTab === 'group-based',
                            'text-base-content/60 hover:text-base-content hover:bg-base-100/70':
                                selectedModeTab !== 'group-based',
                        }"
                        @click="selectedModeTab = 'group-based'"
                    >
                        <LucideIcon name="Trophy" class="w-3.5 h-3.5" />
                        <span>各組獨立</span>
                        <span
                            class="ml-1 inline-flex items-center justify-center min-w-[1.35rem] h-5 rounded-full bg-base-300 text-[11px] font-semibold text-base-content/80"
                        >
                            {{ groupBasedTemplatesCount }}
                        </span>
                    </button>
                </div>
            </div>

            <!-- 範本卡片（可拖曳排序） -->
            <div class="p-4 space-y-2 overflow-y-auto flex-1" @dragover.prevent @dragenter.prevent>
                <div
                    v-for="(template, index) in filteredTemplates"
                    :key="template.id"
                    draggable="true"
                    @dragstart="onDragTemplateStart($event, index)"
                    @dragend="onDragTemplateEnd"
                    @dragover.prevent="onDragTemplateOver($event, index)"
                    @dragenter.prevent="onDragTemplateOver($event, index)"
                    @dragleave="onDragTemplateLeave"
                    @drop="onDropTemplate($event, index)"
                    class="p-3 rounded-lg bg-base-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:scale-[1.02] flex flex-col relative"
                    :class="{
                        'opacity-50': draggedTemplateIndex === index,
                        'ring-2 ring-primary ring-offset-2': dragOverTemplateIndex === index,
                    }"
                >
                    <!-- 標題列 -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex-1">
                            <span class="font-semibold text-sm">{{ template.name }}</span>
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
                            <div class="tooltip tooltip-left" data-tip="刪除這個範本">
                                <button
                                    @click="deleteTemplate(template.id)"
                                    class="btn btn-xs btn-ghost text-error"
                                >
                                    <LucideIcon name="Trash2" class="w-3 h-3" />
                                </button>
                            </div>
                            <!-- Grip handle -->
                            <div class="tooltip tooltip-left" data-tip="拖曳排序範本">
                                <div class="w-4 h-4 flex items-center justify-center opacity-40">
                                    <LucideIcon name="GripVertical" class="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 設定資訊 -->
                    <div class="text-xs space-y-1 text-base-content !text-black">
                        <!-- 全班協作模式參數 -->
                        <template v-if="template.settings.mode === 'class-total'">
                            <div>
                                🎯 全班目標：<span class="font-semibold">{{
                                    template.settings.classTotalTargetPoints
                                }}</span>
                                分
                            </div>
                            <div>
                                ⏱️ 無敵時長：<span class="font-semibold">{{
                                    formatDurationDisplay(
                                        template.settings.invincibleDurationSeconds,
                                    )
                                }}</span>
                            </div>
                            <div>
                                💎 無敵加分：<span class="font-semibold">{{
                                    template.settings.invinciblePointsPerClick
                                }}</span>
                                分/次
                            </div>
                        </template>

                        <!-- 各組獨立模式參數 -->
                        <template v-else-if="template.settings.mode === 'group-based'">
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
                                    formatDurationDisplay(
                                        template.settings.invincibleDurationSeconds,
                                    )
                                }}</span>
                            </div>
                            <div>
                                🎯 無敵加分：<span class="font-semibold">{{
                                    template.settings.invinciblePointsPerClick
                                }}</span>
                                分/次
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <div class="p-4 border-t">
                <button @click="createNewTemplate" class="btn btn-primary btn-sm btn-block gap-2">
                    <LucideIcon name="Plus" class="w-4 h-4" />
                    新增{{ selectedModeTab === 'class-total' ? '全班協作' : '各組獨立' }}範本
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
                            <span class="text-sm text-base-content badge badge-lg">
                                已選 {{ selectedClassIds.length }} 個班級
                            </span>
                            <button @click="openBatchModal" class="btn btn-primary btn-sm gap-2">
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
                                    class="hover:bg-base-200/50 transition-colors"
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
                                            class="text-xs text-base-content flex items-center gap-1"
                                        >
                                            <LucideIcon name="Users" class="w-3 h-3" />
                                            {{ cls.students.length }} 人
                                        </div>
                                    </td>
                                    <td>
                                        <RewardBadge :class-info="cls" />
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
                                    <td colspan="5" class="text-center text-base-content py-12">
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
                            <p class="text-sm text-base-content mt-1">獎勵機制設定</p>
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
        <div class="modal" :class="{ 'modal-open': showBatchModal }">
            <div class="modal-box max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto my-8">
                <div class="flex flex-col gap-6">
                    <div class="flex items-start justify-between">
                        <h3 class="font-bold text-xl flex items-center gap-2">
                            <LucideIcon name="Sparkles" class="w-5 h-5" />
                            批次套用範本
                        </h3>
                        <span class="text-xs text-base-content/70">
                            已選 {{ selectedClassIds.length }} 個班級
                        </span>
                    </div>

                    <section>
                        <p
                            class="text-xs font-semibold tracking-wide text-base-content/70 uppercase mb-3"
                        >
                            批次操作
                        </p>
                        <div class="grid gap-3 sm:grid-cols-2">
                            <label
                                class="group cursor-pointer border rounded-2xl p-4 transition-all shadow-sm"
                                :class="{
                                    'border-primary bg-primary/5 shadow-[0_12px_24px_rgba(25,39,85,0.12)]':
                                        batchAction === 'template',
                                    'border-base-300 hover:border-primary/40 hover:bg-base-200/60':
                                        batchAction !== 'template',
                                }"
                            >
                                <input
                                    type="radio"
                                    name="batchAction"
                                    value="template"
                                    v-model="batchAction"
                                    class="sr-only"
                                />
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2 text-base-content">
                                        <LucideIcon name="Sparkles" class="w-5 h-5 text-primary" />
                                        <span class="font-semibold">套用範本</span>
                                    </div>
                                    <span class="badge badge-primary badge-outline badge-sm"
                                        >推薦</span
                                    >
                                </div>
                                <p class="text-sm text-base-content/70 mt-3">
                                    選擇全班協作或各組獨立的範本，快速同步到所有班級。
                                </p>
                            </label>

                            <label
                                class="group cursor-pointer border rounded-2xl p-4 transition-all shadow-sm"
                                :class="{
                                    'border-error bg-error/5 shadow-[0_12px_24px_rgba(190,46,37,0.12)]':
                                        batchAction === 'disable',
                                    'border-base-300 hover:border-error/40 hover:bg-error/10':
                                        batchAction !== 'disable',
                                }"
                            >
                                <input
                                    type="radio"
                                    name="batchAction"
                                    value="disable"
                                    v-model="batchAction"
                                    class="sr-only"
                                />
                                <div class="flex items-center gap-2 text-base-content">
                                    <LucideIcon name="Ban" class="w-5 h-5 text-error" />
                                    <span class="font-semibold">停用獎勵</span>
                                </div>
                                <p class="text-sm text-base-content/70 mt-3">
                                    停用後，這些班級的獎勵與無敵功能將立即關閉。
                                </p>
                            </label>
                        </div>
                    </section>

                    <section v-if="batchAction === 'template'" class="space-y-4">
                        <div>
                            <p
                                class="text-xs font-semibold tracking-wide text-base-content/70 uppercase mb-2"
                            >
                                範本模式
                            </p>
                            <div
                                class="flex flex-wrap items-center gap-2 bg-base-200/70 p-1.5 rounded-2xl"
                                role="tablist"
                                aria-label="範本模式切換"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    :aria-selected="batchTemplateMode === 'class-total'"
                                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
                                    :class="{
                                        'bg-base-100 text-primary shadow-[0_6px_18px_rgba(25,39,85,0.15)] border-primary/20':
                                            batchTemplateMode === 'class-total',
                                        'text-base-content/60 hover:text-base-content hover:bg-base-100/70':
                                            batchTemplateMode !== 'class-total',
                                    }"
                                    @click="batchTemplateMode = 'class-total'"
                                >
                                    <LucideIcon name="Users" class="w-4 h-4" />
                                    <span>全班協作</span>
                                    <span class="text-xs text-base-content/50">
                                        ({{ classTotalTemplatesCount }})
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    :aria-selected="batchTemplateMode === 'group-based'"
                                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
                                    :class="{
                                        'bg-base-100 text-primary shadow-[0_6px_18px_rgba(25,39,85,0.15)] border-primary/20':
                                            batchTemplateMode === 'group-based',
                                        'text-base-content/60 hover:text-base-content hover:bg-base-100/70':
                                            batchTemplateMode !== 'group-based',
                                    }"
                                    @click="batchTemplateMode = 'group-based'"
                                >
                                    <LucideIcon name="Trophy" class="w-4 h-4" />
                                    <span>各組獨立</span>
                                    <span class="text-xs text-base-content/50">
                                        ({{ groupBasedTemplatesCount }})
                                    </span>
                                </button>
                            </div>
                            <p class="text-xs text-base-content/70 mt-2">
                                顯示選定模式的範本，共 {{ batchTemplatesByMode.length }} 個選項。
                            </p>
                        </div>

                        <div>
                            <p class="text-sm font-semibold text-base-content">選擇範本</p>
                            <p class="text-xs text-base-content/70 mt-1">
                                套用後將立即覆寫這 {{ selectedClassIds.length }} 個班級的獎勵設定。
                            </p>

                            <div
                                v-if="batchTemplatesByMode.length === 0"
                                class="rounded-2xl border border-dashed border-base-300 bg-base-200/60 p-6 text-center text-sm text-base-content/70"
                            >
                                <LucideIcon
                                    name="PackageSearch"
                                    class="w-8 h-8 mx-auto mb-2 opacity-50"
                                />
                                <p>這個模式還沒有可用的範本，請先在範本庫建立一個。</p>
                            </div>
                            <div v-else class="space-y-3 max-h-64 overflow-y-auto pr-1">
                                <label
                                    v-for="template in batchTemplatesByMode"
                                    :key="template.id"
                                    class="flex items-start gap-3 border rounded-2xl p-4 cursor-pointer transition-all"
                                    :class="{
                                        'border-primary bg-primary/5 shadow-[0_8px_20px_rgba(25,39,85,0.12)]':
                                            batchTemplateId === template.id,
                                        'border-base-300 hover:border-primary/40 hover:bg-base-200/60':
                                            batchTemplateId !== template.id,
                                    }"
                                >
                                    <input
                                        type="radio"
                                        class="radio radio-primary mt-1"
                                        name="batchTemplate"
                                        :value="template.id"
                                        v-model="batchTemplateId"
                                    />
                                    <div class="flex-1">
                                        <div class="flex flex-wrap items-center gap-2">
                                            <span class="font-semibold text-base-content">{{
                                                template.name
                                            }}</span>
                                            <span
                                                class="badge badge-sm"
                                                :class="
                                                    template.settings.mode === 'class-total'
                                                        ? 'badge-info'
                                                        : 'badge-secondary'
                                                "
                                            >
                                                {{
                                                    template.settings.mode === 'class-total'
                                                        ? '全班協作'
                                                        : '各組獨立'
                                                }}
                                            </span>
                                        </div>
                                        <ul
                                            class="mt-3 text-xs text-base-content/70 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2"
                                        >
                                            <template
                                                v-if="template.settings.mode === 'group-based'"
                                            >
                                                <li class="flex items-center gap-2">
                                                    <span class="text-base">💰</span>
                                                    <span
                                                        >每顆星
                                                        {{ template.settings.pointsPerStar }}
                                                        分</span
                                                    >
                                                </li>
                                                <li class="flex items-center gap-2">
                                                    <span class="text-base">⭐</span>
                                                    <span
                                                        >無敵門檻
                                                        {{ template.settings.starsToInvincible }}
                                                        顆星</span
                                                    >
                                                </li>
                                                <li class="flex items-center gap-2">
                                                    <span class="text-base">⏱️</span>
                                                    <span>
                                                        無敵時長
                                                        {{
                                                            formatDurationSafe(
                                                                template.settings
                                                                    .invincibleDurationSeconds,
                                                            )
                                                        }}
                                                    </span>
                                                </li>
                                                <li class="flex items-center gap-2">
                                                    <span class="text-base">💎</span>
                                                    <span
                                                        >無敵加分
                                                        {{
                                                            template.settings
                                                                .invinciblePointsPerClick
                                                        }}
                                                        分/次</span
                                                    >
                                                </li>
                                            </template>
                                            <template v-else>
                                                <li class="flex items-center gap-2">
                                                    <span class="text-base">🎯</span>
                                                    <span>
                                                        全班目標
                                                        {{
                                                            template.settings
                                                                .classTotalTargetPoints ??
                                                            template.settings.classTotalMode
                                                                ?.pointsPerInvincible ??
                                                            '—'
                                                        }}
                                                        分
                                                    </span>
                                                </li>
                                                <li class="flex items-center gap-2">
                                                    <span class="text-base">⏱️</span>
                                                    <span>
                                                        無敵時長
                                                        {{
                                                            formatDurationSafe(
                                                                template.settings
                                                                    .invincibleDurationSeconds ??
                                                                    template.settings.classTotalMode
                                                                        ?.invincibleDurationSeconds,
                                                            )
                                                        }}
                                                    </span>
                                                </li>
                                                <li class="flex items-center gap-2">
                                                    <span class="text-base">💎</span>
                                                    <span>
                                                        無敵加分
                                                        {{
                                                            template.settings
                                                                .invinciblePointsPerClick ??
                                                            template.settings.classTotalMode
                                                                ?.invinciblePointsPerClick ??
                                                            '—'
                                                        }}
                                                        分/次
                                                    </span>
                                                </li>
                                            </template>
                                        </ul>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>

                    <div class="alert alert-info">
                        <LucideIcon name="Info" class="w-5 h-5 flex-shrink-0" />
                        <span class="text-sm leading-relaxed">
                            將
                            <span v-if="batchAction === 'template'">套用範本</span>
                            <span v-else-if="batchAction === 'disable'">停用獎勵</span>
                            至 {{ selectedClassIds.length }} 個班級，修改將立即生效。
                        </span>
                    </div>

                    <div class="modal-action">
                        <button @click="closeBatchModal" class="btn btn-ghost">取消</button>
                        <button
                            @click="applyBatchAction"
                            class="btn btn-primary"
                            :disabled="batchAction === 'template' && !batchTemplateId"
                        >
                            確認執行
                        </button>
                    </div>
                </div>
            </div>
            <label class="modal-backdrop" @click="closeBatchModal"></label>
        </div>

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
import { ref, computed, watch } from 'vue'
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
const batchAction = ref<'template' | 'disable'>('template')

const batchTemplateMode = ref<'group-based' | 'class-total'>('class-total')

// 模式類型 Tab（預設為全班協作模式）
const selectedModeTab = ref<'group-based' | 'class-total'>('class-total')

// 根據 Tab 篩選範本
const filteredTemplates = computed(() => {
    return rewardsStore.rewardTemplates.filter(
        (template) => template.settings.mode === selectedModeTab.value,
    )
})

// 各模式範本數量
const classTotalTemplatesCount = computed(() => {
    return rewardsStore.rewardTemplates.filter((t) => t.settings.mode === 'class-total').length
})

const groupBasedTemplatesCount = computed(() => {
    return rewardsStore.rewardTemplates.filter((t) => t.settings.mode === 'group-based').length
})

if (classTotalTemplatesCount.value === 0 && groupBasedTemplatesCount.value > 0) {
    batchTemplateMode.value = 'group-based'
}

const batchTemplatesByMode = computed(() => {
    return rewardsStore.rewardTemplates.filter(
        (template) => template.settings.mode === batchTemplateMode.value,
    )
})

const resolveDefaultBatchMode = (): 'group-based' | 'class-total' => {
    if (classTotalTemplatesCount.value === 0 && groupBasedTemplatesCount.value > 0) {
        return 'group-based'
    }
    return 'class-total'
}

const formatDurationSafe = (seconds?: number | null) => {
    if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
        return '—'
    }
    return formatDurationDisplay(seconds)
}

watch(batchTemplateMode, () => {
    const template = rewardsStore.getTemplateById(batchTemplateId.value)
    if (template?.settings.mode !== batchTemplateMode.value) {
        batchTemplateId.value = ''
    }
})

watch(batchAction, (newAction) => {
    if (newAction !== 'template') {
        batchTemplateId.value = ''
    }
})

watch([classTotalTemplatesCount, groupBasedTemplatesCount], () => {
    const hasTemplates = classTotalTemplatesCount.value + groupBasedTemplatesCount.value > 0
    if (hasTemplates && batchTemplatesByMode.value.length === 0) {
        batchTemplateMode.value = resolveDefaultBatchMode()
    }
})

// 確認對話狀態
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null)
const pendingAction = ref<(() => void) | null>(null)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const activeClassesInGrouping = ref<string[]>([])

// 範本排序拖放狀態
const draggedTemplateIndex = ref<number | null>(null)
const dragOverTemplateIndex = ref<number | null>(null)

// 範本編輯
const templateModalRef = ref<any>(null)
const editingTemplate = ref<RewardTemplate | null>(null)
const isCreatingNew = ref(false)

// 預設範本設定（根據 Tab 決定初始 mode）
const defaultTemplateSettings = computed<RewardSettings>(() => {
    if (selectedModeTab.value === 'class-total') {
        return {
            enabled: true,
            mode: 'class-total',
            classTotalTargetPoints: 100,
            invincibleDurationSeconds: 30,
            invinciblePointsPerClick: 5,
            milestoneMessages: buildDefaultMilestoneMessages(3),
        }
    } else {
        return {
            enabled: true,
            mode: 'group-based',
            pointsPerStar: 10,
            starsToInvincible: 3,
            invincibleDurationSeconds: 30,
            invinciblePointsPerClick: 5,
            milestoneMessages: buildDefaultMilestoneMessages(3),
        }
    }
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
}

// 範本排序拖放事件
const onDragTemplateStart = (event: DragEvent, index: number) => {
    draggedTemplateIndex.value = index
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(index))
    }
}

const onDragTemplateEnd = () => {
    draggedTemplateIndex.value = null
    dragOverTemplateIndex.value = null
}

const onDragTemplateOver = (event: DragEvent, index: number) => {
    if (draggedTemplateIndex.value === null) return
    event.preventDefault()
    dragOverTemplateIndex.value = index
}

const onDragTemplateLeave = (event: DragEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
    ) {
        dragOverTemplateIndex.value = null
    }
}

const onDropTemplate = (event: DragEvent, toIndex: number) => {
    event.preventDefault()
    event.stopPropagation()

    if (draggedTemplateIndex.value === null || draggedTemplateIndex.value === toIndex) {
        draggedTemplateIndex.value = null
        dragOverTemplateIndex.value = null
        return
    }

    const templates = filteredTemplates.value
    const draggedTemplate = templates[draggedTemplateIndex.value]
    if (!draggedTemplate) {
        draggedTemplateIndex.value = null
        dragOverTemplateIndex.value = null
        return
    }

    const success = rewardsStore.moveTemplateWithinMode(
        draggedTemplate.settings.mode,
        draggedTemplate.id,
        toIndex,
    )
    if (success) {
        uiStore.showSuccess('範本排序已更新')
    }

    draggedTemplateIndex.value = null
    dragOverTemplateIndex.value = null
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
const resetBatchModalState = () => {
    batchAction.value = 'template'
    batchTemplateId.value = ''
    batchTemplateMode.value = resolveDefaultBatchMode()
}

const openBatchModal = () => {
    resetBatchModalState()
    showBatchModal.value = true
}

const closeBatchModal = () => {
    showBatchModal.value = false
    resetBatchModalState()
}

const applyBatchAction = () => {
    if (batchAction.value === 'template') {
        applyBatchTemplate()
    } else if (batchAction.value === 'disable') {
        applyBatchDisable()
    }
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

const applyBatchDisable = () => {
    const activeClasses = getActiveClassesFromList(selectedClassIds.value)

    const performDisable = () => {
        let successCount = 0
        selectedClassIds.value.forEach((classId) => {
            const success = classesStore.setRewardSettingsMode(classId, 'disabled')
            if (success) successCount++
        })

        if (successCount > 0) {
            uiStore.showSuccess(`已停用 ${successCount} 個班級的獎勵機制`)
            selectedClassIds.value = []
            closeBatchModal()
        } else {
            uiStore.showError('停用獎勵失敗，請稍後再試')
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
            `以下班級正在活動進行中：${activeClassNames}\n\n停用獎勵機制後，活動中的獎勵將無法繼續計算。\n\n確定要停用所有選定班級的獎勵嗎？`,
            performDisable,
        )
    } else {
        performDisable()
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
    if (isNew) {
        const newTemplate = rewardsStore.addTemplate(template.name, template.settings)
        if (newTemplate) {
            uiStore.showSuccess('範本已建立')
            editingTemplate.value = null
            isCreatingNew.value = false
        }
    } else {
        rewardsStore.updateTemplate(template.id, template)
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
            '確定要重設系統嗎？\n\n這將：\n• 清除所有自訂獎勵範本\n• 恢復兩個初始範本（各組獨立 + 全班協作）\n• 所有班級的獎勵設定將被停用\n\n此動作無法復原！',
        )
    ) {
        rewardsStore.resetToDefault()
        classesStore.resetAllClassesToDefault()
        selectedClassIds.value = []
        uiStore.showSuccess('系統已重設到初始狀態')
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
