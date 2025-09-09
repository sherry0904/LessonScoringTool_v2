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

        <!-- 主要內容區域 -->
        <main class="w-full h-screen">
            <NuxtPage />
        </main>
    </div>
</template>

<script setup lang="ts">
import { useClassStore } from '~/stores/class'
import { useUIStore } from '~/stores/ui'

const ui = useUIStore()
const classStore = useClassStore()

// Toast 圖示對應
const getToastIcon = (type: string) => {
    const icons = {
        success: 'CheckCircle',
        error: 'XCircle',
        warning: 'AlertTriangle',
        info: 'Info',
    }
    return icons[type as keyof typeof icons] || 'Info'
}

// 初始化主題
onMounted(() => {
    ui.initializeTheme()
})
</script>

<style scoped>
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
