import api from "../lib/axios"

export interface AnalyticsData {
  trends: { _id: string; count: number }[]
  categories: { _id: string; count: number }[]
  areas: { _id: string; count: number }[]
  resolutionStats: { avgResolutionHours: number }
  aiStats: { accuracy: number }
}

export const analyticsApi = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const response = await api.get("/analytics")
    return response.data
  }
}
