<template>
    <div id="app" class="min-h-screen bg-base-100">
        <!-- 載入指示器 -->
        <div
            v-if="ui.isLoading"
            class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
            <div class="loading loading-spinner loading-lg text-primary"></div>
        </div>

        <!-- Toast 通知 -->
        <div class="toast toast-top toast-end z-40">
            <div
                v-for="toast in ui.visibleToasts"
                :key="toast.id"
                :class="[
                    'alert',
                    {
                        'alert-success': toast.type === 'success',
                        'alert-error': toast.type === 'error',
                        'alert-warning': toast.type === 'warning',
                        'alert-info': toast.type === 'info',
                    },
                ]"
                class="animate-fade-in-up"
            >
                <LucideIcon :name="getToastIcon(toast.type)" class="w-5 h-5" />
                <div>
                    <div class="font-semibold">{{ toast.title }}</div>
                    <div v-if="toast.message" class="text-sm opacity-80">{{ toast.message }}</div>
                </div>
                <button @click="ui.removeToast(toast.id)" class="btn btn-ghost btn-sm btn-circle">
                    <LucideIcon name="X" class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- 主要應用程式佈局 -->
        <div class="flex h-screen">
            <!-- 側邊欄 -->
            <aside
                :class="[
                    'bg-base-200 border-r border-base-300 transition-all duration-300 z-30',
                    ui.isSidebarOpen ? 'w-64' : 'w-16',
                    ui.isMobile && ui.isSidebarOpen && 'fixed inset-y-0 left-0',
                ]"
            >
                <!-- Logo/Header -->
                <div class="p-4 border-b border-base-300">
                    <div v-if="ui.isSidebarOpen" class="flex items-center space-x-3">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center"
                        >
                            <LucideIcon name="GraduationCap" class="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 class="font-bold text-lg text-gradient">課堂評分工具</h1>
                            <p class="text-sm text-base-content/60">v2.0</p>
                        </div>
                    </div>
                    <div v-else class="flex justify-center">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center"
                        >
                            <LucideIcon name="GraduationCap" class="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                <!-- 導航選單 -->
                <nav class="p-2">
                    <ul class="space-y-1">
                        <li v-for="tab in ui.tabs" :key="tab.id">
                            <button
                                @click="ui.setCurrentTab(tab.id)"
                                :class="[
                                    'w-full flex items-center p-3 rounded-lg transition-colors duration-200',
                                    ui.currentTab === tab.id
                                        ? 'bg-primary text-primary-content'
                                        : 'hover:bg-base-300 text-base-content',
                                ]"
                                :title="!ui.isSidebarOpen ? tab.label : ''"
                            >
                                <LucideIcon :name="getTabIcon(tab.icon)" class="w-5 h-5 shrink-0" />
                                <span
                                    v-if="ui.isSidebarOpen"
                                    class="ml-3 font-medium whitespace-nowrap"
                                >
                                    {{ tab.label }}
                                </span>
                            </button>
                        </li>
                    </ul>
                </nav>

                <!-- 底部工具 -->
                <div class="absolute bottom-4 left-2 right-2">
                    <div class="space-y-2">
                        <!-- 主題切換 -->
                        <button
                            @click="ui.toggleTheme()"
                            class="w-full flex items-center p-3 rounded-lg hover:bg-base-300 text-base-content transition-colors"
                            :title="!ui.isSidebarOpen ? '切換主題' : ''"
                        >
                            <LucideIcon
                                :name="ui.isDarkMode ? 'Sun' : 'Moon'"
                                class="w-5 h-5 shrink-0"
                            />
                            <span
                                v-if="ui.isSidebarOpen"
                                class="ml-3 font-medium whitespace-nowrap"
                            >
                                切換主題
                            </span>
                        </button>

                        <!-- 側邊欄切換 -->
                        <button
                            @click="ui.toggleSidebar()"
                            class="w-full flex items-center p-3 rounded-lg hover:bg-base-300 text-base-content transition-colors"
                            :title="!ui.isSidebarOpen ? '展開選單' : '收合選單'"
                        >
                            <LucideIcon
                                :name="ui.isSidebarOpen ? 'ChevronLeft' : 'ChevronRight'"
                                class="w-5 h-5 shrink-0"
                            />
                            <span
                                v-if="ui.isSidebarOpen"
                                class="ml-3 font-medium whitespace-nowrap"
                            >
                                收合選單
                            </span>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- 主要內容區域 -->
            <main class="flex-1 overflow-hidden">
                <!-- 頂部工具列 -->
                <header class="bg-base-100 border-b border-base-300 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <button
                                v-if="ui.isMobile"
                                @click="ui.toggleSidebar()"
                                class="btn btn-ghost btn-sm"
                            >
                                <LucideIcon name="Menu" class="w-5 h-5" />
                            </button>

                            <div>
                                <h2 class="text-xl font-semibold text-base-content">
                                    {{ ui.currentTabInfo.label }}
                                </h2>
                                <p
                                    v-if="classStore.currentSession"
                                    class="text-sm text-base-content/60"
                                >
                                    {{ classStore.currentSession.className }} ·
                                    {{ formatDate(classStore.currentSession.date) }}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3">
                            <!-- 搜尋 -->
                            <div class="relative">
                                <input
                                    v-model="ui.searchQuery"
                                    type="search"
                                    placeholder="搜尋學生..."
                                    class="input input-bordered input-sm w-64 pl-10"
                                />
                                <LucideIcon
                                    name="Search"
                                    class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50"
                                />
                            </div>

                            <!-- 狀態指示器 -->
                            <div class="flex items-center space-x-2">
                                <div
                                    v-if="classStore.isGroupingActive"
                                    class="flex items-center space-x-2 px-3 py-1 bg-success/20 text-success rounded-full text-sm"
                                >
                                    <div
                                        class="w-2 h-2 bg-success rounded-full animate-pulse"
                                    ></div>
                                    <span>分組進行中</span>
                                </div>

                                <div class="text-sm text-base-content/60">
                                    {{ classStore.presentStudents.length }} /
                                    {{ classStore.totalStudents }} 人出席
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- 頁面內容 -->
                <div class="h-[calc(100vh-5rem)] overflow-auto custom-scrollbar">
                    <NuxtPage />
                </div>
            </main>
        </div>

        <!-- Mobile 側邊欄遮罩 -->
        <div
            v-if="ui.isMobile && ui.isSidebarOpen"
            @click="ui.toggleSidebar()"
            class="fixed inset-0 bg-black/50 z-20"
        ></div>

        <!-- Modals -->
        <div v-for="modal in ui.openModals" :key="modal.id">
            <div class="modal modal-open">
                <div
                    :class="[
                        'modal-box',
                        {
                            'max-w-sm': modal.size === 'sm',
                            'max-w-2xl': modal.size === 'md',
                            'max-w-4xl': modal.size === 'lg',
                            'max-w-6xl': modal.size === 'xl',
                        },
                    ]"
                >
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-lg">{{ modal.title }}</h3>
                        <button
                            @click="ui.closeModal(modal.id)"
                            class="btn btn-ghost btn-sm btn-circle"
                        >
                            <LucideIcon name="X" class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- Modal 內容會由具體的 modal 組件提供 -->
                    <slot :name="`modal-${modal.id}`" />
                </div>
                <div class="modal-backdrop" @click="ui.closeModal(modal.id)"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useClassStore } from '~/stores/class'
import { useUIStore } from '~/stores/ui'

const classStore = useClassStore()
const ui = useUIStore()

// 初始化
onMounted(() => {
    ui.initialize()

    // 如果沒有現有課程，初始化預設課程
    if (!classStore.currentSession) {
        classStore.initializeClass('我的課程')
    }
})

onUnmounted(() => {
    ui.cleanup()
})

// Toast 圖示映射
const getToastIcon = (type: string) => {
    const icons = {
        success: 'CheckCircle2',
        error: 'XCircle',
        warning: 'AlertTriangle',
        info: 'Info',
    }
    return icons[type] || 'Info'
}

// Tab 圖示映射
const getTabIcon = (icon: string) => {
    const iconMap = {
        home: 'Home',
        users: 'Users',
        'users-3': 'Users',
        'chart-bar': 'BarChart3',
        'cog-6-tooth': 'Settings',
    }
    return iconMap[icon] || 'Home'
}

// 日期格式化
const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    })
}

// SEO
useHead({
    title: '課堂評分工具 v2.0',
    meta: [
        {
            name: 'description',
            content: '現代化的課堂管理與學生評分工具，支援分組模式、即時統計和數據匯出',
        },
    ],
})
</script>

<style scoped>
/* 自定義滾動條樣式 */
.custom-scrollbar {
    scrollbar-color: theme('colors.base-300') theme('colors.base-200');
    scrollbar-width: thin;
}

/* 動畫效果 */
.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
