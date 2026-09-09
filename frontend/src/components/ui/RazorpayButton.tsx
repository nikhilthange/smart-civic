import { useState } from "react"
import { CreditCard, Loader2, IndianRupee, Lock } from "lucide-react"
import { Button } from "./button"
import toast from "react-hot-toast"
import { paymentApi, loadRazorpay } from "../../services/paymentApi"
import { useAuth } from "../../context/AuthContext"

interface RazorpayButtonProps {
  amount: number             // in paise  (e.g. 50000 = ₹500)
  purpose?: string
  description?: string
  complaintId?: string
  label?: string
  onSuccess?: (paymentId: string) => void
  onFailure?: () => void
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
}

export function RazorpayButton({
  amount,
  purpose = "other",
  description = "Smart Civic Payment",
  complaintId,
  label,
  onSuccess,
  onFailure,
  className = "",
  variant = "default",
  size = "default",
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handlePay = async () => {
    setLoading(true)
    try {
      // 1. Load Razorpay SDK
      const sdkLoaded = await loadRazorpay()
      if (!sdkLoaded) {
        toast.error("Razorpay SDK failed to load. Check your internet connection.")
        return
      }

      // 2. Create order on our backend
      const order = await paymentApi.createOrder({ amount, purpose, description, complaintId })
      if (!order.success) throw new Error("Could not create order")

      // 3. Open Razorpay checkout modal
      const options = {
        key:          order.keyId,
        amount:       order.amount,
        currency:     order.currency,
        name:         "Smart Civic AI",
        description,
        order_id:     order.orderId,
        prefill: {
          name:  user?.name  || "",
          email: user?.email || "",
        },
        theme:  { color: "#6366f1" },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled.", { icon: "ℹ️" })
            setLoading(false)
          },
        },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            // 4. Verify on backend (HMAC validation)
            await paymentApi.verify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              paymentDbId:         order.payment._id,
            })
            toast.success(`Payment of ₹${(amount / 100).toFixed(2)} successful! 🎉`)
            onSuccess?.(response.razorpay_payment_id)
          } catch {
            toast.error("Payment verification failed. Contact support.")
            onFailure?.()
          } finally {
            setLoading(false)
          }
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", (response: any) => {
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"}`)
        onFailure?.()
        setLoading(false)
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Payment initialization failed")
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      id="razorpay-pay-btn"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      {loading ? "Processing..." : (label || `Pay ₹${(amount / 100).toFixed(2)}`)}
    </Button>
  )
}

// ─── Compact inline payment card ─────────────────────────────────────────────
export function PaymentCard({
  title,
  amount,
  description,
  purpose,
  complaintId,
  onSuccess,
}: {
  title: string
  amount: number
  description?: string
  purpose?: string
  complaintId?: string
  onSuccess?: (paymentId: string) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
            <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        </div>
        <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{(amount / 100).toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <Lock className="h-3 w-3 text-emerald-500" />
        Secured by Razorpay · 256-bit SSL encrypted
      </div>
      <RazorpayButton
        amount={amount}
        purpose={purpose}
        description={description}
        complaintId={complaintId}
        onSuccess={onSuccess}
        className="w-full"
      />
    </div>
  )
}
