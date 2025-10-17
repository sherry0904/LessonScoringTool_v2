import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
    ToastType,
    ToastMessage,
    ViewModeType,
    UserPreferences,
    Tab,
    Student,
} from '~/types/class'

const SECURITY_NOTICE_KEY = 'security-notice-ack'

// Helper function to apply theme to the DOM
const applyThemeToDOM = (theme: 'light' | 'dark' | 'auto') => {
    if (process.client) {
        let actualTheme = theme
        if (theme === 'auto') {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
        }
        document.documentElement.setAttribute('data-theme', actualTheme)
    }
}

export const useUIStore = defineStore('ui', () => {
    // State
    const currentTab = ref<string>('dashboard')
    const viewMode = ref<ViewModeType>('table')
    const toasts = ref<ToastMessage[]>([])
    const modals = ref<Map<string, boolean>>(new Map())
    const isLoading = ref(false)
    const isSidebarOpen = ref(false)
    const searchQuery = ref('')
    const selectedStudents = ref<Set<string>>(new Set())
    const userPreferences = ref<UserPreferences>({
        theme: 'auto',
        language: 'zh-TW',
        enableAnimations: true,
        enableSounds: false,
        autoSave: true,
        showTutorials: true,
        defaultView: 'grid',
        compactMode: false,
    })
    const isMobile = ref(false)
    const isTablet = ref(false)
    const windowWidth = ref(0)
    const showSecurityNotice = ref(true)
    const groupingViewCollapsed = ref(false)

    // --- Grouping Settings ---
    const groupingSettings = ref({
        leaderboardDisplayCount: 'all' as 'all' | number, // 顯示全部或前幾名
        showGroupTotalScores: true, // 是否顯示各組總積分
        showStudentIndividualScores: true, // 是否顯示各學生積分
        allowIndividualScoring: true, // 是否可對組內學生加減分
    })

    // --- Tool States ---
    // Timer
    const isTimerVisible = ref(false)
    const timerSecondsRemaining = ref(300)
    const isTimerRunning = ref(false)
    const timerDuration = ref(300) // 預設 5 分鐘
    const timerInterval = ref<NodeJS.Timeout | null>(null)

    // Student Picker
    const isPickerVisible = ref(false)
    const pickerWinner = ref<Student | null>(null)
    const isPicking = ref(false)
    const pickerDrawnStudents = ref<Student[]>([])
    const pickerPosition = ref<{ x: number; y: number } | null>(null)

    // Computed
    const isDarkMode = computed(() => {
        if (userPreferences.value.theme === 'auto') {
            if (process.client) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches
            }
            return false
        }
        return userPreferences.value.theme === 'dark'
    })

    const currentTabInfo = computed(() => {
        const tabMap: Record<string, Tab> = {
            dashboard: { id: 'dashboard', label: '總覽', icon: 'School', color: 'primary' },
            homework: { id: 'homework', label: '作業管理', icon: 'BookMarked', color: 'accent' },
            students: { id: 'students', label: '學生管理', icon: 'Users', color: 'info' },
            settings: { id: 'settings', label: '設定', icon: 'Settings', color: 'warning' },
        }
        return tabMap[currentTab.value] || tabMap.dashboard
    })

    const visibleToasts = computed(() => {
        return toasts.value.slice(0, 5) // 只顯示最新的 5 個
    })

    const openModals = computed(() => {
        return Array.from(modals.value.entries())
            .filter(([_, isOpen]) => isOpen)
            .map(([id, _]) => id)
    })

    const tabs = computed(() => {
        return [
            { id: 'dashboard', label: '總覽', icon: 'School', color: 'primary' },
            { id: 'homework', label: '作業管理', icon: 'BookMarked', color: 'accent' },
            { id: 'students', label: '學生管理', icon: 'Users', color: 'info' },
            { id: 'grouping-management', label: '分組管理', icon: 'Settings2', color: 'success' },
            { id: 'settings', label: '設定', icon: 'Settings', color: 'warning' },
        ]
    })

    // Actions
    const setCurrentTab = (tab: string) => {
        currentTab.value = tab
    }

    const setViewMode = (mode: ViewModeType) => {
        viewMode.value = mode
    }

    const toggleSidebar = () => {
        isSidebarOpen.value = !isSidebarOpen.value
    }

    const setSidebarOpen = (open: boolean) => {
        isSidebarOpen.value = open
    }

    const setSearchQuery = (query: string) => {
        searchQuery.value = query
    }

    const setGroupingViewCollapsed = (collapsed: boolean) => {
        groupingViewCollapsed.value = collapsed
    }

    const persistGroupingSettings = () => {
        if (process.client) {
            localStorage.setItem(
                'groupingSettings',
                JSON.stringify(groupingSettings.value),
            )
        }
    }

    // Preferences methods
    const updatePreferences = (updates: Partial<UserPreferences>) => {
        userPreferences.value = { ...userPreferences.value, ...updates }
        if (process.client) {
            localStorage.setItem('userPreferences', JSON.stringify(userPreferences.value))
            // If theme is updated, apply it to the DOM
            if (updates.theme) {
                applyThemeToDOM(updates.theme)
            }
        }
    }

    const toggleTheme = () => {
        const currentTheme = userPreferences.value.theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        updatePreferences({ theme: newTheme })
    }

    const resetPreferences = () => {
        const defaultPrefs: UserPreferences = {
            theme: 'auto',
            language: 'zh-TW',
            enableAnimations: true,
            enableSounds: false,
            autoSave: true,
            showTutorials: true,
            defaultView: 'grid',
            compactMode: false,
        }
        userPreferences.value = defaultPrefs
        if (process.client) {
            localStorage.setItem('userPreferences', JSON.stringify(defaultPrefs))
            applyThemeToDOM(defaultPrefs.theme)
        }
    }

    // Toast methods
    const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
        const toast: ToastMessage = {
            id: Date.now().toString(),
            message,
            type,
            timestamp: new Date(),
            duration,
        }
        toasts.value.unshift(toast)
        if (duration > 0) {
            setTimeout(() => removeToast(toast.id), duration)
        }
    }

    const removeToast = (id: string) => {
        const index = toasts.value.findIndex((toast) => toast.id === id)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    const clearAllToasts = () => {
        toasts.value = []
    }

    const showSuccess = (message: string) => showToast(message, 'success')
    const showError = (message: string) => showToast(message, 'error', 5000)
    const showWarning = (message: string) => showToast(message, 'warning', 4000)
    const showInfo = (message: string) => showToast(message, 'info')

    // Modal methods
    const openModal = (id: string) => {
        modals.value.set(id, true)
    }

    const closeModal = (id: string) => {
        modals.value.set(id, false)
    }

    const closeAllModals = () => {
        for (const key of modals.value.keys()) {
            modals.value.set(key, false)
        }
    }

    // Loading methods
    const setLoading = (loading: boolean) => {
        isLoading.value = loading
    }

    const withLoading = async <T>(promise: Promise<T>): Promise<T> => {
        setLoading(true)
        try {
            return await promise
        } finally {
            setLoading(false)
        }
    }

    // Student selection methods
    const toggleStudentSelection = (studentId: string) => {
        if (selectedStudents.value.has(studentId)) {
            selectedStudents.value.delete(studentId)
        } else {
            selectedStudents.value.add(studentId)
        }
    }

    const clearStudentSelection = () => {
        selectedStudents.value.clear()
    }

    const selectAllStudents = (studentIds: string[]) => {
        selectedStudents.value = new Set(studentIds)
    }

    // --- Timer Actions ---
    const toggleTimer = (visible?: boolean) => {
        isTimerVisible.value = visible ?? !isTimerVisible.value
    }

    const setTimer = (seconds: number) => {
        timerDuration.value = seconds
        timerSecondsRemaining.value = seconds
        isTimerRunning.value = false
        if (timerInterval.value) clearInterval(timerInterval.value)
    }

    const startTimer = () => {
        if (isTimerRunning.value || timerSecondsRemaining.value <= 0) return
        isTimerRunning.value = true
        timerInterval.value = setInterval(() => {
            timerSecondsRemaining.value--
            if (timerSecondsRemaining.value <= 0) {
                if (timerInterval.value) clearInterval(timerInterval.value)
                isTimerRunning.value = false
                // Optional: Play sound or show notification
                const alarm = new Audio('/old/assets/alarm.mp3')
                alarm.play()
                showInfo('時間到！')
            }
        }, 1000)
    }

    const pauseTimer = () => {
        isTimerRunning.value = false
        if (timerInterval.value) clearInterval(timerInterval.value)
    }

    const resetTimer = () => {
        isTimerRunning.value = false
        if (timerInterval.value) clearInterval(timerInterval.value)
        timerSecondsRemaining.value = timerDuration.value
    }

    // --- Picker Actions ---
    // 清空已抽過名單
    const clearDrawnStudents = () => {
        pickerDrawnStudents.value = []
    }
    // 移除已抽過學生
    const returnStudentToPool = (studentId: string) => {
        const idx = pickerDrawnStudents.value.findIndex((s) => s.id === studentId)
        if (idx !== -1) pickerDrawnStudents.value.splice(idx, 1)
    }
    const openPicker = () => {
        console.log('Attempting to open picker...');
        isPickerVisible.value = true
        pickerWinner.value = null
        isPicking.value = false
    }

    const closePicker = () => {
        isPickerVisible.value = false
    }

    const startPicking = (students: Student[]) => {
        if (isPicking.value || students.length === 0) return
        isPicking.value = true
        pickerWinner.value = null

        setTimeout(() => {
            const winner = students[Math.floor(Math.random() * students.length)]
            pickerWinner.value = winner
            isPicking.value = false
            // 加入已抽過名單，避免重複
            if (winner && !pickerDrawnStudents.value.find((s) => s.id === winner.id)) {
                pickerDrawnStudents.value.push(winner)
            }
        }, 1500) // 1.5秒動畫
    }

    const setPickerPosition = (position: { x: number; y: number }) => {
        pickerPosition.value = position
        if (process.client) {
            localStorage.setItem('pickerPosition', JSON.stringify(position))
        }
    }

    // Responsive methods
    const updateScreenSize = () => {
        if (process.client) {
            windowWidth.value = window.innerWidth
            isMobile.value = window.innerWidth < 768
            isTablet.value = window.innerWidth >= 768 && window.innerWidth < 1024
        }
    }

    const handleKeyboard = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            closeAllModals()
            closePicker()
        }
    }

    // Lifecycle methods
    const initialize = () => {
        if (process.client) {
            // Load user preferences
            const savedPreferences = localStorage.getItem('userPreferences')
            if (savedPreferences) {
                try {
                    const parsedPrefs = JSON.parse(savedPreferences)
                    // Merge with defaults to avoid missing properties on update
                    userPreferences.value = { ...userPreferences.value, ...parsedPrefs }
                } catch (error) {
                    console.warn('Failed to parse user preferences:', error)
                }
            }

            // Load grouping settings
            const savedGroupingSettings = localStorage.getItem('groupingSettings')
            if (savedGroupingSettings) {
                try {
                    const parsedSettings = JSON.parse(savedGroupingSettings)
                    groupingSettings.value = { ...groupingSettings.value, ...parsedSettings }
                } catch (error) {
                    console.warn('Failed to parse grouping settings:', error)
                }
            }

            // Load picker position
            const savedPickerPosition = localStorage.getItem('pickerPosition')
            if (savedPickerPosition) {
                try {
                    pickerPosition.value = JSON.parse(savedPickerPosition)
                } catch (error) {
                    console.warn('Failed to parse picker position:', error)
                }
            }

            // Apply initial theme
            applyThemeToDOM(userPreferences.value.theme)

            // Load security notice acknowledgement status
            const securityNoticeFlag = localStorage.getItem(SECURITY_NOTICE_KEY)
            if (securityNoticeFlag === 'true') {
                showSecurityNotice.value = false
            }

            // Init responsive listeners
            updateScreenSize()
            window.addEventListener('resize', updateScreenSize)
            window.addEventListener('keydown', handleKeyboard)
        }
    }

    const cleanup = () => {
        if (process.client) {
            window.removeEventListener('resize', updateScreenSize)
            window.removeEventListener('keydown', handleKeyboard)
            if (timerInterval.value) clearInterval(timerInterval.value)
        }
    }

    const acknowledgeSecurityNotice = () => {
        showSecurityNotice.value = false
        if (process.client) {
            localStorage.setItem(SECURITY_NOTICE_KEY, 'true')
        }
    }

    return {
        // State
        currentTab,
        viewMode,
        toasts,
        modals,
        isLoading,
        isSidebarOpen,
        searchQuery,
        selectedStudents,
        userPreferences,
        isMobile,
        isTablet,
        windowWidth,
        showSecurityNotice,
        groupingViewCollapsed, // new state

        // Grouping Settings
        groupingSettings,

        // Timer State
        isTimerVisible,
        timerSecondsRemaining,
        isTimerRunning,
        timerDuration,

        // Picker State
        isPickerVisible,
        pickerWinner,
        isPicking,
        pickerDrawnStudents,
        pickerPosition,
        clearDrawnStudents,

        // Computed
        isDarkMode,
        currentTabInfo,
        visibleToasts,
        openModals,
        tabs,

        // Actions
        setCurrentTab,
        setViewMode,
        toggleSidebar,
        setSidebarOpen,
        setSearchQuery,
        setGroupingViewCollapsed, // new action
        persistGroupingSettings,
        clearStudentSelection,
        toggleTheme,
        updatePreferences,
        resetPreferences,

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

        // Student selection methods
        toggleStudentSelection,
        selectAllStudents,

        // Timer Actions
        toggleTimer,
        setTimer,
        startTimer,
        pauseTimer,
        resetTimer,

        // Picker Actions
        openPicker,
        closePicker,
        startPicking,
        returnStudentToPool,
        setPickerPosition,

        // Lifecycle
        initialize,
        cleanup,
        acknowledgeSecurityNotice,
    }
})