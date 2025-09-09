// types/class.ts
export interface Student {
    id: string
    name: string
    score: number
    group?: number | null
    grade?: number | null
}
export interface Group {
    id: number
    score: number
}
export interface Class {
    id: string
    name: string
    students: Student[]
    groupCount: number
    groups: Group[]
    groupingActive: boolean
    homeworks: any[]
}
