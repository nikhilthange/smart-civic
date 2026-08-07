import api from "@/lib/axios"

export interface Payment {
  _id: string
  complaint?: { _id: string; complaintId: string; title: string; status: string }
  payer?: { name: string; email: string }
  amount: number               // in paise
  currency: string
  status: "pending" | "success" | "failed" | "refunded"
  paymentMethod?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  description?: string
  paidAt?: string
  failureReason?: string
  createdAt: string
}

export interface CreateOrderResponse {
  success: boolean
  orderId: string
  amount: number
  currency: string
  receipt: string
  keyId: string
  payment: { _id: string }
}

export interface PaymentsResponse {
  success: boolean
  payments: Payment[]
  total: number
  page: number
  pages: number
}

export const paymentApi = {
  createOrder: async (data: {
    amount: number
    purpose?: string
    description?: string
    complaintId?: string
    currency?: string
  }) => {
    const res = await api.post<CreateOrderResponse>("/payments/create-order", data)
    return res.data
  },

  verify: async (data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    paymentDbId?: string
  }) => {
    const res = await api.post("/payments/verify", data)
    return res.data
  },

  getHistory: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await api.get<PaymentsResponse>("/payments/history", { params })
    return res.data
  },

  getOne: async (id: string) => {
    const res = await api.get<{ success: boolean; payment: Payment }>(`/payments/${id}`)
    return res.data.payment
  },

  getStats: async () => {
    const res = await api.get<{
      success: boolean
      total: number
      totalRevenue: number
      byStatus: { _id: string; count: number; amount: number }[]
    }>("/payments/stats")
    return res.data
  },
}

// Load Razorpay JS SDK dynamically
export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
