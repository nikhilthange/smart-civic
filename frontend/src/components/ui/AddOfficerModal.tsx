import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "./button"
import toast from "react-hot-toast"
import { officerApi } from "../../services/officerApi"
import { departmentApi, type Department } from "../../services/departmentApi"
import api from "@/lib/axios"

interface AddOfficerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddOfficerModal({ isOpen, onClose, onSuccess }: AddOfficerModalProps) {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    employeeId: "",
    designation: ""
  })

  useEffect(() => {
    if (isOpen) {
      api.get("/departments")
        .then(res => {
          if (res.data?.departments) setDepartments(res.data.departments)
        })
        .catch(() => {
          departmentApi.getNearby(0, 0, 100000).then(setDepartments).catch(() => {})
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await officerApi.create(formData)
      toast.success("Officer added successfully")
      onSuccess()
      onClose()
      setFormData({ name: "", email: "", password: "", departmentId: "", employeeId: "", designation: "" })
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add officer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[95vw] sm:max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">Add New Officer</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-10" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Password</label>
            <input required minLength={8} type="password" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-10" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Department</label>
            <select required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-10" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Employee ID</label>
            <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-10" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Designation</label>
            <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-10" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
          </div>
          
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} className="min-h-[44px]">Cancel</Button>
            <Button type="submit" disabled={loading} className="min-h-[44px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Officer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
