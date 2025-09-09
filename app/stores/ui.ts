import { defineStore } from 'pinia'
import type { Toast, Modal, TabItem, ViewMode, UserPreferences } from '~/types'

export const useUIStore = defineStore('ui', () => {
    // State
    const currentTab = ref('dashboard')
    const viewMode = ref<ViewMode>('grid')
    const toasts = ref<Toast[]>([])
    const modals = ref<Modal[]>([])
    const isLoading = ref(false)
    const isSidebarOpen = ref(false)
    const searchQuery = ref('')
    const selectedStudents = ref<string[]>([])

    const userPreferences = ref<UserPreferences>({
        theme: 'light',
        language: 'zh-TW',
        soundEnabled: true,
        animationsEnabled: true,
        defaultView: 'grid',
        autoSave: true,
        compactMode: false,
    })

    const tabs: TabItem[] = [
        { id: 'dashboard', label: '課堂總覽', icon: 'home' },
        { id: 'students', label: '學生管理', icon: 'users' },
        { id: 'grouping', label: '分組模式', icon: 'users-3' },
        { id: 'statistics', label: '統計分析', icon: 'chart-bar' },
        { id: 'settings', label: '設定', icon: 'cog-6-tooth' },
    ]

    // Computed
    const currentTabInfo = computed(
        () => tabs.find((tab) => tab.id === currentTab.value) || tabs[0],
    )

    const visibleToasts = computed(() => toasts.value.filter((toast) => toast.id))

    const openModals = computed(() => modals.value.filter((modal) => modal.isOpen))

    const isDarkMode = computed(
        () =>
            userPreferences.value.theme === 'dark' ||
            (userPreferences.value.theme === 'auto' &&
                process.client &&
                window.matchMedia('(prefers-color-scheme: dark)').matches),
    )

    // Actions
    const setCurrentTab = (tabId: string) => {
        if (tabs.some((tab) => tab.id === tabId)) {
            currentTab.value = tabId
            savePreferences()
        }
    }

    const setViewMode = (mode: ViewMode) => {
        viewMode.value = mode
        userPreferences.value.defaultView = mode
        savePreferences()
    }

    const toggleSidebar = () => {
        isSidebarOpen.value = !isSidebarOpen.value
    }

    const setSearchQuery = (query: string) => {
        searchQuery.value = query
    }

    const toggleStudentSelection = (studentId: string) => {
        const index = selectedStudents.value.indexOf(studentId)
        if (index > -1) {
            selectedStudents.value.splice(index, 1)
        } else {
            selectedStudents.value.push(studentId)
        }
    }

    const selectAllStudents = (studentIds: string[]) => {
        selectedStudents.value = [...studentIds]
    }

    const clearStudentSelection = () => {
        selectedStudents.value = []
    }

    // Toast 管理
    const showToast = (toast: Omit<Toast, 'id'>) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newToast: Toast = {
            ...toast,
            id,
            duration: toast.duration || 3000,
        }

        toasts.value.push(newToast)

        // 自動移除
        if (newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, newToast.duration)
        }

        return id
    }

    const removeToast = (toastId: string) => {
        const index = toasts.value.findIndex((t) => t.id === toastId)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    const clearAllToasts = () => {
        toasts.value = []
    }

    // 便利方法
    const showSuccess = (title: string, message?: string, duration?: number) => {
        return showToast({ type: 'success', title, message, duration })
    }

    const showError = (title: string, message?: string, duration?: number) => {
        return showToast({ type: 'error', title, message, duration: duration || 5000 })
    }

    const showWarning = (title: string, message?: string, duration?: number) => {
        return showToast({ type: 'warning', title, message, duration })
    }

    const showInfo = (title: string, message?: string, duration?: number) => {
        return showToast({ type: 'info', title, message, duration })
    }

    // Modal 管理
    const openModal = (modal: Omit<Modal, 'isOpen'>) => {
        const existingModal = modals.value.find((m) => m.id === modal.id)
        if (existingModal) {
            existingModal.isOpen = true
        } else {
            modals.value.push({ ...modal, isOpen: true })
        }
    }

    const closeModal = (modalId: string) => {
        const modal = modals.value.find((m) => m.id === modalId)
        if (modal) {
            modal.isOpen = false
        }
    }

    const closeAllModals = () => {
        modals.value.forEach((modal) => {
            modal.isOpen = false
        })
    }

    // Loading 狀態
    const setLoading = (loading: boolean) => {
        isLoading.value = loading
    }

    const withLoading = async <T>(asyncFn: () => Promise<T>): Promise<T> => {
        setLoading(true)
        try {
            return await asyncFn()
        } finally {
            setLoading(false)
        }
    }

    // 主題管理
    const setTheme = (theme: UserPreferences['theme']) => {
        userPreferences.value.theme = theme
        applyTheme()
        savePreferences()
    }

    const toggleTheme = () => {
        const themes: UserPreferences['theme'][] = ['light', 'dark', 'auto']
        const currentIndex = themes.indexOf(userPreferences.value.theme)
        const nextTheme = themes[(currentIndex + 1) % themes.length]
        setTheme(nextTheme)
    }

    const applyTheme = () => {
        if (process.client) {
            const html = document.documentElement

            if (isDarkMode.value) {
                html.setAttribute('data-theme', 'dark')
                html.classList.add('dark')
            } else {
                html.setAttribute('data-theme', 'light')
                html.classList.remove('dark')
            }
        }
    }

    // 設定管理
    const updatePreferences = (updates: Partial<UserPreferences>) => {
        Object.assign(userPreferences.value, updates)
        savePreferences()

        // 立即套用某些設定
        if (updates.theme) {
            applyTheme()
        }
    }

    const savePreferences = () => {
        if (process.client) {
            localStorage.setItem('user-preferences', JSON.stringify(userPreferences.value))
        }
    }

    const loadPreferences = () => {
        if (process.client) {
            try {
                const saved = localStorage.getItem('user-preferences')
                if (saved) {
                    const preferences = JSON.parse(saved)
                    Object.assign(userPreferences.value, preferences)
                    applyTheme()
                }
            } catch (error) {
                console.error('載入使用者偏好設定失敗:', error)
            }
        }
    }

    const resetPreferences = () => {
        userPreferences.value = {
            theme: 'light',
            language: 'zh-TW',
            soundEnabled: true,
            animationsEnabled: true,
            defaultView: 'grid',
            autoSave: true,
            compactMode: false,
        }
        applyTheme()
        savePreferences()
    }

    // 鍵盤快捷鍵
    const handleKeyboard = (event: KeyboardEvent) => {
        // Ctrl/Cmd + 數字鍵切換分頁
        if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '5') {
            event.preventDefault()
            const tabIndex = parseInt(event.key) - 1
            if (tabs[tabIndex]) {
                setCurrentTab(tabs[tabIndex].id)
            }
        }

        // ESC 關閉所有 modal
        if (event.key === 'Escape') {
            closeAllModals()
        }

        // Ctrl/Cmd + / 開啟搜尋
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault()
            // 觸發搜尋焦點事件
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
            if (searchInput) {
                searchInput.focus()
            }
        }
    }

    // 響應式支援
    const isMobile = ref(false)
    const isTablet = ref(false)
    const windowWidth = ref(0)

    const updateScreenSize = () => {
        if (process.client) {
            windowWidth.value = window.innerWidth
            isMobile.value = window.innerWidth < 768
            isTablet.value = window.innerWidth >= 768 && window.innerWidth < 1024

            // 在小螢幕上自動關閉側邊欄
            if (isMobile.value && isSidebarOpen.value) {
                isSidebarOpen.value = false
            }
        }
    }

    // 初始化
    const initialize = () => {
        loadPreferences()
        updateScreenSize()

        if (process.client) {
            window.addEventListener('resize', updateScreenSize)
            window.addEventListener('keydown', handleKeyboard)

            // 監聽系統主題變更
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
            darkModeQuery.addEventListener('change', () => {
                if (userPreferences.value.theme === 'auto') {
                    applyTheme()
                }
            })
        }
    }

    // 清理
    const cleanup = () => {
        if (process.client) {
            window.removeEventListener('resize', updateScreenSize)
            window.removeEventListener('keydown', handleKeyboard)
        }
    }

    return {
        // State
        currentTab: readonly(currentTab),
        viewMode: readonly(viewMode),
        toasts: readonly(toasts),
        modals: readonly(modals),
        isLoading: readonly(isLoading),
        isSidebarOpen: readonly(isSidebarOpen),
        searchQuery: readonly(searchQuery),
        selectedStudents: readonly(selectedStudents),
        userPreferences: readonly(userPreferences),
        isMobile: readonly(isMobile),
        isTablet: readonly(isTablet),
        windowWidth: readonly(windowWidth),

        // Computed
        currentTabInfo,
        visibleToasts,
        openModals,
        isDarkMode,
        tabs,

        // Actions
        setCurrentTab,
        setViewMode,
        toggleSidebar,
        setSearchQuery,
        toggleStudentSelection,
        selectAllStudents,
        clearStudentSelection,

        // Toast methods
        showToast,
        removeToast,
        clearAllToasts,
        showSuccess,
        showError,
        showWarning,
        showInfo,

        // Modal methods
        openModal,
        closeModal,
        closeAllModals,

        // Loading methods
        setLoading,
        withLoading,

        // Theme methods
        setTheme,
        toggleTheme,

        // Preferences methods
        updatePreferences,
        resetPreferences,

        // Lifecycle
        initialize,
        cleanup,
    }
})
