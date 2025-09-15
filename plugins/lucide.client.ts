import {
    Home,
    Users,
    BarChart3,
    Settings,
    Plus,
    Trash2,
    Edit,
    Search,
    Filter,
    Download,
    Upload,
    Menu,
    X,
    ChevronDown,
    ChevronUp,
    Star,
    Calendar,
    Clock,
    Trophy,
    Target,
    Shuffle,
    Play,
    Square,
    UserCheck,
    Eye,
    EyeOff,
    // 新增更語義化的圖示
    LogIn,
    ArrowRight,
    Edit2,
    Edit3,
    GraduationCap,
    BookOpen,
    TrendingUp,
    UserPlus,
    ArrowLeft,
    AlertCircle,
    ChevronsLeft,
    ChevronsRight,
    ScrollText,
    UserMinus,
    CircleDot,
    School,
    Settings2,
} from 'lucide-vue-next'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('LucideHome', Home)
    nuxtApp.vueApp.component('LucideUsers', Users)
    nuxtApp.vueApp.component('LucideBarChart3', BarChart3)
    nuxtApp.vueApp.component('LucideSettings', Settings)
    nuxtApp.vueApp.component('LucidePlus', Plus)
    nuxtApp.vueApp.component('LucideTrash2', Trash2)
    nuxtApp.vueApp.component('LucideEdit', Edit)
    nuxtApp.vueApp.component('LucideSearch', Search)
    nuxtApp.vueApp.component('LucideFilter', Filter)
    nuxtApp.vueApp.component('LucideDownload', Download)
    nuxtApp.vueApp.component('LucideUpload', Upload)
    nuxtApp.vueApp.component('LucideMenu', Menu)
    nuxtApp.vueApp.component('LucideX', X)
    nuxtApp.vueApp.component('LucideChevronDown', ChevronDown)
    nuxtApp.vueApp.component('LucideChevronUp', ChevronUp)
    nuxtApp.vueApp.component('LucideStar', Star)
    nuxtApp.vueApp.component('LucideCalendar', Calendar)
    nuxtApp.vueApp.component('LucideClock', Clock)
    nuxtApp.vueApp.component('LucideTrophy', Trophy)
    nuxtApp.vueApp.component('LucideTarget', Target)
    nuxtApp.vueApp.component('LucideShuffle', Shuffle)
    nuxtApp.vueApp.component('LucidePlay', Play)
    nuxtApp.vueApp.component('LucideSquare', Square)
    nuxtApp.vueApp.component('LucideUserCheck', UserCheck)
    nuxtApp.vueApp.component('LucideEye', Eye)
    nuxtApp.vueApp.component('LucideEyeOff', EyeOff)
    nuxtApp.vueApp.component('LucideLogIn', LogIn)
    nuxtApp.vueApp.component('LucideArrowRight', ArrowRight)
    nuxtApp.vueApp.component('LucideEdit2', Edit2)
    nuxtApp.vueApp.component('LucideEdit3', Edit3)
    nuxtApp.vueApp.component('LucideGraduationCap', GraduationCap)
    nuxtApp.vueApp.component('LucideBookOpen', BookOpen)
    nuxtApp.vueApp.component('LucideTrendingUp', TrendingUp)
    nuxtApp.vueApp.component('LucideUserPlus', UserPlus)
    nuxtApp.vueApp.component('LucideArrowLeft', ArrowLeft)
    nuxtApp.vueApp.component('LucideAlertCircle', AlertCircle)
    nuxtApp.vueApp.component('LucideChevronsLeft', ChevronsLeft)
    nuxtApp.vueApp.component('LucideChevronsRight', ChevronsRight)
    nuxtApp.vueApp.component('LucideScrollText', ScrollText)
    nuxtApp.vueApp.component('LucideUserMinus', UserMinus)
    nuxtApp.vueApp.component('LucideCircleDot', CircleDot)
    nuxtApp.vueApp.component('LucideSchool', School)
    nuxtApp.vueApp.component('LucideSettings2s', Settings2)
})
