import api from "@/lib/axios"

export interface Officer {
  _id: string
  name: string
  email: string
  employeeId: string
  designation: string
  department: {
    _id: string
    name: string
    code: string
  }
  user: {
    _id: string
    name: string
    email: string
    isActive: boolean
    avatar?: string
  }
}

export interface OfficerPerformance {
  _id: string
  name: string
  code: string
  totalOfficers: number
  totalActiveComplaints: number
  totalResolvedComplaints: number
}

export const officerApi = {
  create: async (data: any) => {
    const res = await api.post("/officers", data)
    return res.data
  },

  getAll: async (departmentId?: string) => {
    const params = departmentId ? { departmentId } : {}
    const res = await api.get<{ success: boolean; officers: Officer[] }>("/officers", { params })
    return res.data.officers
  },

  getPerformance: async () => {
    const res = await api.get<{ success: boolean; stats: OfficerPerformance[] }>("/officers/performance")
    return res.data.stats
  }
}
