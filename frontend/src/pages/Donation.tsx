import { useState, useEffect } from "react"
import { ShieldCheck, HeartHandshake, TreePine, Trash2, Car, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { donationApi } from "@/services/donationApi"
import { useAuth } from "@/context/AuthContext"

// Add razorpay types to window
declare global {
  interface Window {
    Razorpay: any;
  }
}

const DONATION_CATEGORIES = [
  {
    id: "Road Repair",
    title: "Road Repair",
    description: "Contribute to fixing potholes and improving road infrastructure in your area.",
    icon: Car,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "Garbage Management",
    title: "Garbage Management",
    description: "Support better waste collection systems and recycling initiatives.",
    icon: Trash2,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "Tree Plantation",
    title: "Tree Plantation",
    description: "Help us make the city greener by funding tree plantation drives.",
    icon: TreePine,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
]

export default function Donation() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | "">("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleDonate = async () => {
    if (!selectedCategory || !amount || Number(amount) < 1) {
      setError("Please select a category and enter a valid amount.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Create order on backend
      const { order, donationId, keyId } = await donationApi.createOrder({
        purpose: selectedCategory,
        amount: Number(amount),
      })

      // 2. Open Razorpay Checkout
      const options = {
        key: keyId, // Your Razorpay Key ID
        amount: order.amount, // in paise
        currency: order.currency,
        name: "Smart Civic AI",
        description: `Donation for ${selectedCategory}`,
        image: "https://example.com/your_logo",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            await donationApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donationId: donationId,
            })
            setSuccess(true)
          } catch {
            setError("Payment verification failed. Please contact support.")
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: "9999999999", // Can be dynamic
        },
        theme: {
          color: "#4f46e5", // primary color
        },
      }

      const rzp1 = new window.Razorpay(options)
      rzp1.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed.")
      })
      rzp1.open()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initiate donation.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto w-full py-12">
        <Card className="glass-card text-center border-t-4 border-t-green-500">
          <CardContent className="pt-10 pb-8 flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thank you!</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Your donation towards <strong>{selectedCategory}</strong> has been received successfully.
              This will greatly help in civic improvement!
            </p>
            <Button className="mt-4" onClick={() => setSuccess(false)}>
              Make Another Donation
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <HeartHandshake className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Civic Improvement Donations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
            Your contributions help fund critical public projects. All donations are securely processed via Razorpay and directly allocated to the respective civic departments.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DONATION_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.id
          return (
            <Card
              key={cat.id}
              className={`glass-card cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <CardContent className="p-6">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${cat.bg}`}>
                  <Icon className={`h-6 w-6 ${cat.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2 dark:text-white">{cat.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{cat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Amount and Checkout */}
      {selectedCategory && (
        <Card className="glass-card mt-8 border-t-4 border-t-primary fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Enter Donation Amount</CardTitle>
            <CardDescription>
              Donating towards: <strong>{selectedCategory}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="pl-8"
                  min="1"
                />
              </div>
              <Button 
                onClick={handleDonate} 
                disabled={isLoading}
                className="w-full sm:w-auto min-w-40"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><ShieldCheck className="mr-2 h-4 w-4" /> Secure Donate</>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Secured by Razorpay Payment Gateway
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
