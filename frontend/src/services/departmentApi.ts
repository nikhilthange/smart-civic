import api from "@/lib/axios"

export interface Department {
  _id: string
  name: string
  code: string
  contactEmail: string
  contactPhone: string
  location?: {
    coordinates: [number, number]
  }
}

export const departmentApi = {
  getNearby: async (lat: number, lng: number, radius?: number) => {
    const res = await api.get<{ success: boolean; departments: Department[] }>("/departments/nearby", {
      params: { lat, lng, radius },
    })
    return res.data.departments
  },
}
