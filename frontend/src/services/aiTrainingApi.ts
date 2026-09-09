import api from "@/lib/axios"

export interface AiModelStats {
  version: string
  totalEpochs: number
  lastTrainedAt: string
  vocabularySize: number
  transitionPriorsCount: number
  totalTrainingSamples: number
  averageAccuracy: number
  untrainedSamplesCount?: number
  lossHistory: Array<{
    epoch: number
    loss: number
    accuracy: number
    samplesTrained?: number
    timestamp: string
  }>
}

export interface AiFeedbackSample {
  _id: string
  inputText: string
  imageUrl?: string
  predictedCategory: string
  correctedCategory: string
  predictedDepartment: string
  correctedDepartment: string
  predictedSeverity: string
  correctedSeverity: string
  confidenceAtPrediction: number
  source: string
  contributorRole: string
  ward: string
  weight: number
  isTrained: boolean
  createdAt: string
}

export const aiTrainingApi = {
  getModelStats: async (): Promise<{ stats: AiModelStats; recentFeedback: AiFeedbackSample[] }> => {
    const res = await api.get("/ai/model-stats")
    return res.data
  },

  triggerTraining: async (params?: { epochs?: number; batchSize?: number }) => {
    const res = await api.post("/ai/train", params || { epochs: 1, batchSize: 64 })
    return res.data
  },

  submitFeedback: async (feedback: Partial<AiFeedbackSample>) => {
    const res = await api.post("/ai/feedback", feedback)
    return res.data
  },

  exportDatasetUrl: (format = "jsonl") => {
    const base = import.meta.env.VITE_API_URL || "/api"
    return `${base.replace(/\/$/, "")}/ai/export-dataset?format=${format}`
  },
}
