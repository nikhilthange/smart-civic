import api from "../lib/axios"

export interface CreateOrderParams {
  amount: number
  purpose: string
}

export interface VerifyPaymentParams {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  donationId: string
}

export const donationApi = {
  createOrder: async (data: CreateOrderParams) => {
    const response = await api.post("/donations/create-order", data)
    return response.data
  },
  
  verifyPayment: async (data: VerifyPaymentParams) => {
    const response = await api.post("/donations/verify-payment", data)
    return response.data
  },

  getMyDonations: async () => {
    const response = await api.get("/donations/my-donations")
    return response.data
  }
}
