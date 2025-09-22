// app/stores/homework.ts
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type { GlobalHomework } from '~/app/types/homework'

export const useHomeworkStore = defineStore('homework', {
    state: () => ({
        /**
         * 全域作業範本列表
         * @type {GlobalHomework[]}
         */
        homeworkList: [] as GlobalHomework[],
    }),
    actions: {
        /**
         * 從 localStorage 或後端 API 載入作業列表
         */
        async fetchAllHomework() {
            // 在此處實作從持久層（例如 localStorage）讀取資料的邏輯
            // 為了範例，初始化 20 筆假資料
            if (this.homeworkList.length === 0) {
                const names = [
                    '第一單元練習',
                    '期中報告',
                    '期末報告',
                    '閱讀心得',
                    '數學小考',
                    '英文作文',
                    '科學專題',
                    '歷史報告',
                    '地理作業',
                    '美術創作',
                    '音樂賞析',
                    '體育日誌',
                    '社會觀察',
                    '程式設計',
                    '語文競賽',
                    '專題討論',
                    '小組合作',
                    '自學任務',
                    '課外閱讀',
                    '期末總結',
                ]
                const notesList = [
                    '練習簿 P.10 ~ P.15',
                    '分組報告，主題自訂',
                    '期末總結，請準備簡報',
                    '閱讀指定書籍並寫心得',
                    '小考範圍：單元一至三',
                    '題目自選，字數不少於300',
                    '請完成專題並上傳',
                    '請撰寫歷史人物分析',
                    '地圖繪製與分析',
                    '自由創作一幅畫',
                    '音樂欣賞並寫感想',
                    '記錄一週運動情形',
                    '觀察社會現象並報告',
                    '完成指定程式題目',
                    '參加語文競賽並回饋',
                    '討論指定主題',
                    '小組合作完成任務',
                    '自訂學習目標並執行',
                    '閱讀課外書籍',
                    '期末學習總結',
                ]
                this.homeworkList = Array.from({ length: 20 }, (_, i) => ({
                    id: `hw_${i + 1}`,
                    name: names[i % names.length],
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * i).toISOString(),
                    notes: notesList[i % notesList.length],
                    hiddenFromClassIds: i % 3 === 0 ? ['class_2'] : [],
                    isArchived: i % 7 === 0,
                }))
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
            // 在此處可以加上儲存到持久層的邏輯
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
                // 在此處可以加上儲存到持久層的邏輯
            }
        },

        /**
         * 刪除一個全域作業
         * @param {string} id
         */
        deleteHomework(id: string) {
            this.homeworkList = this.homeworkList.filter((hw) => hw.id !== id)
            // 在此處可以加上儲存到持久層的邏輯
        },

        /**
         * 封存/取消封存一個作業
         * @param {string} id
         */
        toggleArchive(id: string) {
            const homework = this.homeworkList.find((hw) => hw.id === id)
            if (homework) {
                homework.isArchived = !homework.isArchived
                // 在此處可以加上儲存到持久層的邏輯
            }
        },
    },
})
