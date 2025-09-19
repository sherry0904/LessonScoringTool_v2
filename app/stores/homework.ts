// app/stores/homework.ts
import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';
import type { GlobalHomework } from '~/app/types/homework';

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
      // 為了範例，我們先初始化一些假資料
      if (this.homeworkList.length === 0) {
        this.homeworkList = [
          {
            id: 'hw_1',
            name: '第一單元練習',
            createdAt: new Date().toISOString(),
            notes: '練習簿 P.10 ~ P.15',
            hiddenFromClassIds: [],
            isArchived: false,
          },
          {
            id: 'hw_2',
            name: '期中報告',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            notes: '分組報告，主題自訂',
            hiddenFromClassIds: ['class_2'], // 假設 class_2 不顯示此作業
            isArchived: false,
          },
          {
            id: 'hw_3',
            name: '舊的學期作業',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
            notes: '這是一個已經封存的作業範例',
            hiddenFromClassIds: [],
            isArchived: true,
          },
        ];
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
      };
      this.homeworkList.unshift(newHomework);
      // 在此處可以加上儲存到持久層的邏輯
    },

    /**
     * 更新一個全域作業
     * @param {string} id
     * @param {Partial<GlobalHomework>} updates
     */
    updateHomework(id: string, updates: Partial<Omit<GlobalHomework, 'id'>>) {
      const index = this.homeworkList.findIndex(hw => hw.id === id);
      if (index !== -1) {
        this.homeworkList[index] = { ...this.homeworkList[index], ...updates };
        // 在此處可以加上儲存到持久層的邏輯
      }
    },

    /**
     * 刪除一個全域作業
     * @param {string} id
     */
    deleteHomework(id: string) {
      this.homeworkList = this.homeworkList.filter(hw => hw.id !== id);
      // 在此處可以加上儲存到持久層的邏輯
    },

    /**
     * 封存/取消封存一個作業
     * @param {string} id
     */
    toggleArchive(id: string) {
      const homework = this.homeworkList.find(hw => hw.id === id);
      if (homework) {
        homework.isArchived = !homework.isArchived;
        // 在此處可以加上儲存到持久層的邏輯
      }
    }
  },
});
