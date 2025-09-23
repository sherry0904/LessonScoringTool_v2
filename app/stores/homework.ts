// app/stores/homework.ts
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type { GlobalHomework } from '~/app/types/homework'

const STORAGE_KEY = 'global-homework-list'

export const useHomeworkStore = defineStore('homework', {
    state: () => ({
        /**
         * 全域作業範本列表
         * @type {GlobalHomework[]}
         */
        homeworkList: [] as GlobalHomework[],
    }),
    getters: {
        hasHomework(state) {
            return state.homeworkList.length > 0
        },
    },
    actions: {
        /**
         * 從 localStorage 讀取資料。若尚未有作業，留空讓頁面提示新增。
         */
        async fetchAllHomework() {
            if (this.homeworkList.length > 0) return

            if (typeof window === 'undefined') return

            try {
                const stored = window.localStorage.getItem(STORAGE_KEY)
                if (stored) {
                    const parsed = JSON.parse(stored)
                    if (Array.isArray(parsed)) {
                        this.homeworkList = parsed
                    }
                }
            } catch (error) {
                console.error('載入作業資料失敗:', error)
            }
        },

        /**
         * 新增一個全域作業
         * @param {Omit<GlobalHomework, 'id' | 'createdAt' | 'isArchived' | 'hiddenFromClassIds'>} homeworkData
         */
        addHomework(homeworkData: Pick<GlobalHomework, 'name' | 'notes'>) {
            const newHomework: GlobalHomework = {
                id: `hw_${nanoid(8)}`,
                createdAt: new Date().toISOString(),
                isArchived: false,
                hiddenFromClassIds: [],
                ...homeworkData,
            }
            this.homeworkList.unshift(newHomework)
            this.persist()
        },

        /**
         * 更新一個全域作業
         * @param {string} id
         * @param {Partial<GlobalHomework>} updates
         */
        updateHomework(id: string, updates: Partial<Omit<GlobalHomework, 'id'>>) {
            const index = this.homeworkList.findIndex((hw) => hw.id === id)
            if (index !== -1) {
                this.homeworkList[index] = { ...this.homeworkList[index], ...updates }
                this.persist()
            }
        },

        /**
         * 刪除一個全域作業
         * @param {string} id
         */
        deleteHomework(id: string) {
            this.homeworkList = this.homeworkList.filter((hw) => hw.id !== id)
            this.persist()
        },

        /**
         * 封存/取消封存一個作業
         * @param {string} id
         */
        toggleArchive(id: string) {
            const homework = this.homeworkList.find((hw) => hw.id === id)
            if (homework) {
                homework.isArchived = !homework.isArchived
                this.persist()
            }
        },

        persist() {
            try {
                if (typeof window === 'undefined') return
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.homeworkList))
            } catch (error) {
                console.error('儲存作業資料失敗:', error)
            }
        },
    },
})
