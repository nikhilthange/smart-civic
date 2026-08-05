import api from "../lib/axios"

export interface CreateFeedbackData {
  complaintId: string
  rating: number
  comment?: string
  tags?: string[]
  isAnonymous?: boolean
}

export const feedbackApi = {
  submit: async (data: CreateFeedbackData) => {
    const res = await api.post("/feedback", data)
    return res.data
  },
}
