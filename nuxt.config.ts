/**
 * @file Nuxt configuration file
 * @author sherryhsieh
 * @see {@link https://nuxt.com/docs/api/configuration/nuxt-config}
 */

// https://nuxt.com/docs/api/configuration/nuxt-config
const devConnectSources = process.env.NODE_ENV === 'production' ? [] : ['ws://localhost:*']

const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    ["connect-src 'self'", ...devConnectSources].join(' '),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ')

const metaCspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    ["connect-src 'self'", ...devConnectSources].join(' '),
    "base-uri 'self'",
    "form-action 'self'",
].join('; ')

export default defineNuxtConfig({
    compatibilityDate: '2024-04-03',
    devtools: { enabled: false },

    // GitHub Pages 的部署設定
    ssr: false, // 設定為 false 以進行靜態站點生成 (SSG)
    app: {
        baseURL: '/LessonScoringTool_v2/', // 您的儲存庫名稱
        head: {
            meta: [
                {
                    httpEquiv: 'Content-Security-Policy',
                    content: metaCspDirectives,
                },
                { name: 'referrer', content: 'no-referrer' },
            ],
        },
    },

    routeRules: {
        '/**': {
            headers: {
                'Content-Security-Policy': cspDirectives,
                'Referrer-Policy': 'no-referrer',
                'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
            },
        },
    },

    css: ['~/assets/main.css'],
    modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vueuse/nuxt'],
    tailwindcss: {
        exposeConfig: true,
        viewer: true,
    },
})
