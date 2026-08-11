import api from "../lib/axios"

export interface AnalyticsData {
  success: boolean;
  metrics: {
    total: number;
    pending: number;
    aiVerified: number;
    wardAssigned: number;
    officerAssigned: number;
    inProgress: number;
    resolved: number;
    critical: number;
  };
  byDepartment: { _id: string; count: number }[];
  byWard: { _id: string; count: number }[];
  byCategory: { _id: string; count: number }[];
  workerStats: {
    avgWorkload: number;
    maxWorkload: number;
    totalWorkers: number;
  };
  resolutionStats: {
    avgResolutionHours: number;
  };
  trends: { _id: string; count: number }[];
}

export interface AnalyticsFilters {
  department?: string;
  ward?: string;
  category?: string;
  priority?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const analyticsApi = {
  getAnalytics: async (filters?: AnalyticsFilters): Promise<AnalyticsData> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await api.get(`/analytics?${params.toString()}`);
    return response.data;
  }
}
