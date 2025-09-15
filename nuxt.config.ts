/**
 * @file Nuxt configuration file
 * @author sherryhsieh
 * @see {@link https://nuxt.com/docs/api/configuration/nuxt-config}
 */

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-04-03',
    devtools: { enabled: false },

    // GitHub Pages 的部署設定
    ssr: false, // 設定為 false 以進行靜態站點生成 (SSG)
    app: {
        baseURL: '/LessonScoringTool_v2/', // 您的儲存庫名稱
    },

    css: ['~/assets/main.css'],
    modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vueuse/nuxt'],
    tailwindcss: {
        exposeConfig: true,
        viewer: true,
    },
})
