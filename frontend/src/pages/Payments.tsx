import { useState, useEffect, useCallback } from "react"
import {
  CreditCard, CheckCircle2, XCircle, Clock, RefreshCw,
  Loader2, IndianRupee, TrendingUp, Receipt,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { paymentApi, type Payment } from "@/services/paymentApi"
import { useAuth } from "@/context/AuthContext"
import { PaymentCard } from "@/components/ui/RazorpayButton"
import toast from "react-hot-toast"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  success:  { label: "Success",  color: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 },
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock },
  failed:   { label: "Failed",   color: "bg-red-50 text-red-700 border-red-200",        icon: XCircle },
  refunded: { label: "Refunded", color: "bg-slate-50 text-slate-700 border-slate-200",  icon: RefreshCw },
}

const METHOD_LABELS: Record<string, string> = {
  card:       "💳 Card",
  upi:        "📱 UPI",
  netbanking: "🏦 Net Banking",
  wallet:     "👛 Wallet",
  other:      "💰 Other",
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <Badge variant="outline" className={`text-xs border ${cfg.color} gap-1`}>
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  )
}

function formatAmount(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments]     = useState<Payment[]>([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [stats, setStats] = useState<{ total: number; totalRevenue: number } | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await paymentApi.getHistory({
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      setPayments(data.payments)
      setTotalPages(data.pages)
    } catch {
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  const fetchStats = useCallback(async () => {
    if (user?.role !== "admin") return
    try {
      const data = await paymentApi.getStats()
      setStats({ total: data.total, totalRevenue: data.totalRevenue })
    } catch {
      // non-critical
    }
  }, [user?.role])

  useEffect(() => { fetchPayments() }, [fetchPayments])
  useEffect(() => { fetchStats() }, [fetchStats])

  const totalSpent = payments
    .filter(p => p.status === "success")
    .reduce((acc, p) => acc + p.amount, 0)

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage transactions and payment history
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchPayments}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-indigo-400">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Transactions</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{payments.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-400">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {user?.role === "admin" ? "Total Revenue" : "Amount Paid"}
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {user?.role === "admin"
                    ? formatAmount(stats?.totalRevenue || 0)
                    : formatAmount(totalSpent)
                  }
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-400">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Successful</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {payments.filter(p => p.status === "success").length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo payment card for citizens */}
      {user?.role === "citizen" && (
        <PaymentCard
          title="Expedited Processing Fee"
          amount={10000}
          description="Pay ₹100 to prioritise your complaint in the queue"
          purpose="service_charge"
          onSuccess={() => fetchPayments()}
        />
      )}

      {/* Transaction History */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">Transaction History</CardTitle>
              <CardDescription>All Razorpay payment records</CardDescription>
            </div>
            <select
              className="text-sm border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Reference</th>
                  <th className="px-3 py-3">Complaint</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <CreditCard className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">No transactions yet</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 text-slate-500 text-xs">
                        {p.paidAt
                          ? new Date(p.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        }
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-xs text-primary">
                          {p.razorpayPaymentId || p.razorpayOrderId?.slice(-12) || "—"}
                        </p>
                        <p className="text-[10px] text-slate-400">{p.description || "—"}</p>
                      </td>
                      <td className="px-3 py-3">
                        {p.complaint ? (
                          <span className="font-mono text-xs text-indigo-600">
                            {p.complaint.complaintId}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {p.paymentMethod ? (METHOD_LABELS[p.paymentMethod] || p.paymentMethod) : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`font-semibold ${p.status === "success" ? "text-green-600" : "text-slate-700"}`}>
                          {formatAmount(p.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm">
              <span className="text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
