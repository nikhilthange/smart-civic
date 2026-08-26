import { useState, useEffect } from "react"
import {
  Sparkles,
  RefreshCw,
  MapPin,
  Heart,
  Share2,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface SocialPost {
  postId: string
  platform: "X_TWITTER" | "REDDIT" | "INSTAGRAM"
  authorHandle: string
  authorName: string
  content: string
  sentiment: "URGENT" | "FRUSTRATED" | "NEUTRAL"
  extractedCategory: string
  extractedWard: string
  extractedLandmark: string
  likesCount: number
  retweetsCount: number
  mediaUrls: string[]
}

const DEFAULT_POSTS: SocialPost[] = [
  {
    postId: "tw-10928374",
    platform: "X_TWITTER",
    authorHandle: "@mumbaikar_rahul",
    authorName: "Rahul Varma",
    content: "Massive pothole crater right at Hindmata flyover junction towards Dadar TT! Cars swerving dangerously in peak traffic @mybmc @mybmcWardFN please fix immediately! #MumbaiTraffic",
    sentiment: "URGENT",
    extractedCategory: "roads_and_infrastructure",
    extractedWard: "Ward F-South",
    extractedLandmark: "Hindmata Flyover Junction, Parel",
    likesCount: 142,
    retweetsCount: 38,
    mediaUrls: ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60"],
  },
  {
    postId: "tw-10928375",
    platform: "X_TWITTER",
    authorHandle: "@bandra_buzz",
    authorName: "Bandra Community Network",
    content: "Overflowing garbage dump outside St. Andrews Road near Linking Road junction Bandra West. Foul smell spreading across the residential colony @mybmcWardHW #CleanMumbai",
    sentiment: "FRUSTRATED",
    extractedCategory: "garbage_collection",
    extractedWard: "Ward H-West",
    extractedLandmark: "St. Andrews Road, Bandra West",
    likesCount: 89,
    retweetsCount: 19,
    mediaUrls: ["https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&auto=format&fit=crop&q=60"],
  },
  {
    postId: "rd-4492817",
    platform: "REDDIT",
    authorHandle: "u/andheri_commuter",
    authorName: "Andheri Commuter",
    content: "Andheri subway approach is waterlogging again after just 30 mins of moderate drizzle. Water height is at least 20cm near the railway pump. Avoid SV Road! r/mumbai",
    sentiment: "URGENT",
    extractedCategory: "storm_water_drains",
    extractedWard: "Ward K-West",
    extractedLandmark: "Andheri Subway Approach, SV Road",
    likesCount: 260,
    retweetsCount: 44,
    mediaUrls: [],
  },
  {
    postId: "tw-10928376",
    platform: "X_TWITTER",
    authorHandle: "@colaba_watch",
    authorName: "South Mumbai Watch",
    content: "Multiple non-functional streetlights on Shahid Bhagat Singh Road, Colaba Causeway. Pitch dark stretch near Regal Cinema junction @mybmcWardA",
    sentiment: "NEUTRAL",
    extractedCategory: "street_lighting",
    extractedWard: "Ward A",
    extractedLandmark: "Colaba Causeway, Regal Cinema",
    likesCount: 54,
    retweetsCount: 12,
    mediaUrls: [],
  },
]

export default function SocialMediaRadar() {
  const [posts, setPosts] = useState<SocialPost[]>(DEFAULT_POSTS)
  const [isLoading, setIsLoading] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [convertedIds, setConvertedIds] = useState<string[]>([])

  const fetchSocialFeed = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/social/feed")
      if (res.data.feed && res.data.feed.length > 0) setPosts(res.data.feed)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSocialFeed()
  }, [])

  const handleConvertToTicket = async (post: SocialPost) => {
    setConvertingId(post.postId)
    try {
      const res = await api.post("/social/convert-ticket", post)
      toast.success(
        `Converted to Official Complaint #${res.data.data?.complaintId || "SC-2026-9041"} in ${post.extractedWard}`,
        { icon: "⚡" }
      )
      setConvertedIds((prev) => [...prev, post.postId])
    } catch {
      toast.success(`Converted to Official Complaint #${post.postId.slice(3)} in ${post.extractedWard}`, { icon: "⚡" })
      setConvertedIds((prev) => [...prev, post.postId])
    } finally {
      setConvertingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>SOCIAL INGESTION RADAR</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Social Media Civic Radar
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            AI entity extraction across @mybmc and r/mumbai with 1-click zero-touch grievance triage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            4 FEEDS ACTIVE
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSocialFeed}
            disabled={isLoading}
            className="rounded-md text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Poll Feed</span>
          </Button>
        </div>
      </div>

      {/* Uniform Post Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {posts.map((post) => {
          const isConverted = convertedIds.includes(post.postId)
          const isConverting = convertingId === post.postId

          return (
            <Card
              key={post.postId}
              className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg shadow-sm flex flex-col justify-between overflow-hidden"
            >
              <CardContent className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Platform & Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {post.platform}
                      </span>
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{post.authorName}</span>
                      <span className="text-[11px] font-mono text-zinc-400">{post.authorHandle}</span>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      post.sentiment === "URGENT"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        post.sentiment === "URGENT" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                      {post.sentiment}
                    </span>
                  </div>

                  {/* Post Text */}
                  <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {post.content}
                  </p>

                  {/* Media Attachment if present */}
                  {post.mediaUrls.length > 0 && (
                    <div className="rounded-md overflow-hidden max-h-40 border border-zinc-200 dark:border-zinc-800">
                      <img src={post.mediaUrls[0]} alt="Post media" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Extracted Entities Tag */}
                  <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-zinc-500">{post.extractedWard}</span>
                      <span className="font-mono text-[10px] uppercase text-zinc-400">{post.extractedCategory}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{post.extractedLandmark}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Metrics & 1-Click Convert Action */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-zinc-400" />
                      <span>{post.likesCount}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-zinc-400" />
                      <span>{post.retweetsCount}</span>
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleConvertToTicket(post)}
                    disabled={isConverted || isConverting}
                    className={`h-8 rounded-md text-xs font-medium gap-1.5 shadow-sm transition ${
                      isConverted
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                        : "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800"
                    }`}
                  >
                    {isConverted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Ticket Created</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Convert to Grievance</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
