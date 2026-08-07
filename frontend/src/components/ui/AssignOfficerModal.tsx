import { useState, useEffect } from "react"
import { X, Loader2, UserCheck } from "lucide-react"
import { Button } from "./button"
import toast from "react-hot-toast"
import { officerApi, type Officer } from "../../services/officerApi"
import { complaintApi } from "../../services/complaintApi"

interface AssignOfficerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  complaintId: string
  departmentId?: string
}

export function AssignOfficerModal({ isOpen, onClose, onSuccess, complaintId, departmentId }: AssignOfficerModalProps) {
  const [loading, setLoading] = useState(false)
  const [officers, setOfficers] = useState<Officer[]>([])
  const [fetchingOfficers, setFetchingOfficers] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const fetchOfficers = async () => {
        setFetchingOfficers(true)
        try {
          const data = await officerApi.getAll(departmentId)
          setOfficers(data)
        } catch {
          toast.error("Failed to load officers")
        } finally {
          setFetchingOfficers(false)
        }
      }
      fetchOfficers()
    }
  }, [isOpen, departmentId])

  if (!isOpen) return null

  const handleAssign = async (officerId: string) => {
    setLoading(true)
    try {
      await complaintApi.assignOfficer(complaintId, officerId)
      toast.success("Officer assigned successfully")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign officer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">Assign Officer</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {fetchingOfficers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : officers.length === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm">
              No officers found. Add officers to this department first.
            </div>
          ) : (
            <ul className="space-y-2">
              {officers.map(officer => (
                <li key={officer._id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{officer.name}</p>
                    <p className="text-xs text-slate-500">{officer.designation} • {officer.department.name}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1" 
                    onClick={() => handleAssign(officer._id)}
                    disabled={loading}
                  >
                    <UserCheck className="h-4 w-4" />
                    Assign
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
