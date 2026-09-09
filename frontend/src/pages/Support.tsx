import React, { useState } from "react"
import {
  LifeBuoy,
  PhoneCall,
  Mail,
  MessageSquare,
  FileQuestion,
  ExternalLink,
  Send,
  AlertTriangle,
  Flame,
  Ambulance,
  ShieldAlert,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { Link } from "react-router-dom"

export default function Support() {
  const [ticketCategory, setTicketCategory] = useState("general_inquiry")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error("Please provide both subject and message details")
      return
    }
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubject("")
      setMessage("")
      toast.success("Helpdesk ticket submitted! Reference ID: #BMC-SUP-" + Math.floor(100000 + Math.random() * 900000))
    }, 700)
  }

  const faqs = [
    {
      q: "How do I track the progress of my submitted grievance?",
      a: "Navigate to 'Track Grievance' in the navigation bar and enter your unique Grievance Reference ID (e.g. GRV-2026-XXXX). You can view the assigned department, current SLA countdown, and ground worker status updates in real-time.",
    },
    {
      q: "What happens if a grievance exceeds its statutory SLA deadline?",
      a: "Under the Maharashtra Municipal Corporation Act, if a department fails to resolve a critical hazard within the mandated timeframe (4h for emergency hazards, 24h for standard defects), it is automatically escalated to the Ward Assistant Commissioner and flagged in the red Sitrep audit queue.",
    },
    {
      q: "How does the AI Vision triage classify uploaded photographs?",
      a: "Our neural vision engine extracts 224x224 RGB tensors to classify the civic defect (pothole, solid waste, water leakage, tree hazard), assigns the appropriate municipal department (PWD, SWM, WSD, PRD), and performs 50m geospatial clustering to prevent duplicate tickets.",
    },
    {
      q: "Can I report civic issues using WhatsApp?",
      a: "Yes! Citizens can use the official BMC WhatsApp Citizen Bot to send photos, voice notes, and live GPS pins without logging into the web application. Visit the WhatsApp Sandbox page to test the automated conversational flow.",
    },
  ]

  const emergencyContacts = [
    { name: "BMC Disaster Control Room", number: "1916", icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10" },
    { name: "Mumbai Fire Brigade", number: "101", icon: Flame, color: "text-red-500 bg-red-500/10" },
    { name: "Emergency Medical & Ambulance", number: "108", icon: Ambulance, color: "text-emerald-500 bg-emerald-500/10" },
    { name: "Police & Citizen Safety", number: "100 / 112", icon: ShieldAlert, color: "text-blue-500 bg-blue-500/10" },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Civic Helpdesk & Citizen Support
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Get assistance with municipal grievance tracking, statutory escalations, emergency contacts, and direct support.
        </p>
      </div>

      {/* 24x7 Emergency Helplines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {emergencyContacts.map((contact, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm"
          >
            <div className={`p-3 rounded-lg ${contact.color}`}>
              <contact.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{contact.name}</p>
              <a
                href={`tel:${contact.number}`}
                className="text-lg font-bold text-slate-900 dark:text-white hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="h-4 w-4 text-primary" />
                {contact.number}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Contact Form & Interactive Channels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submit Support Ticket Card */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Contact Municipal Helpdesk</CardTitle>
                  <CardDescription>
                    Submit a query or request assistance from our citizen liaison desk
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Inquiry Category</Label>
                    <select
                      id="category"
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-md p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="general_inquiry">General Municipal Inquiry</option>
                      <option value="grievance_status">Grievance Status Escalation</option>
                      <option value="technical_issue">Portal Technical Issue</option>
                      <option value="ward_budget">Ward Participatory Budget</option>
                      <option value="dpdp_privacy">DPDP Act & Privacy Request</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject / Ticket Title</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Escalation request for ticket GRV-2026-1049"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Detailed Message</Label>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue, including any relevant complaint IDs, dates, or ward location details..."
                    required
                    className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-md p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Submitting Ticket..." : "Submit Support Request"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Frequently Asked Questions */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Frequently Asked Questions (FAQ)</CardTitle>
                  <CardDescription>Instant answers to common citizen inquiries</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200/70 dark:border-slate-800/70 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-3.5 text-left font-medium text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-xs text-primary font-bold">{openFaq === idx ? "−" : "+"}</span>
                  </button>
                  {openFaq === idx && (
                    <div className="p-3.5 pt-1 text-sm text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-200/40 dark:border-slate-800/40 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Instant Assistance Hubs */}
        <div className="space-y-6">
          {/* AI Copilot & Bot Assistance */}
          <Card className="civic-card bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Municipal AI Assistant</CardTitle>
                  <CardDescription>Instant answers & triage assistance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Use our real-time AI assistant for instantaneous guidance on ward officer schedules, grievance bylaws, and municipal policies.
              </p>
              <Link to="/whatsapp-sandbox" className="block">
                <Button variant="outline" className="w-full justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    Open WhatsApp Sandbox
                  </span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Direct Ward Support Channels */}
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Direct Official Channels</CardTitle>
                  <CardDescription>Municipal Corporation of Greater Mumbai</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-slate-200">Central Grievance Redressal</p>
                <p>grievances@smartcivic.mumbai.gov.in</p>
                <p className="text-slate-400">Mon–Sat: 09:00 AM – 06:00 PM IST</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-slate-200">BMC Headquarters Address</p>
                <p>Municipal Headquarters, Mahapalika Marg, Fort, Mumbai 400001</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
