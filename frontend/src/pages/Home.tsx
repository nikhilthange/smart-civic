import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  MapPin, 
  BarChart3, 
  BrainCircuit, 
  Zap, 
  Clock, 
  CheckCircle2,
  Users,
  MessageSquare,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  return (
    <div className="flex min-h-[100svh] flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link className="flex items-center gap-3 transition-transform hover:scale-105" to="/">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Smart Civic AI</span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">How it Works</a>
            <a href="#ai" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300 transition-colors">AI Engine</a>
          </nav>
          <div className="flex gap-4 items-center">
            <Link to="/auth" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/auth">
              <Button size="sm" className="rounded-full px-6 shadow-md shadow-primary/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-48 overflow-hidden bg-white dark:bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-70"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-primary/20 opacity-30 blur-[120px]"></div>
          
          <div className="container relative px-4 md:px-6 mx-auto text-center">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-center gap-6"
            >
              <motion.div variants={fadeUpVariant} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 text-primary">
                <Zap className="h-4 w-4 mr-2 text-amber-500" /> Introducing AI-Powered City Management
              </motion.div>
              <motion.h1 variants={fadeUpVariant} className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none max-w-4xl text-slate-900 dark:text-white leading-[1.1]">
                Empowering Citizens, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                  Building Smarter Cities.
                </span>
              </motion.h1>
              <motion.p variants={fadeUpVariant} className="mx-auto max-w-[700px] text-slate-500 md:text-xl/relaxed lg:text-lg/relaxed xl:text-xl/relaxed dark:text-slate-400">
                Report civic issues instantly, track resolution progress in real-time, and let our advanced AI engine route your complaints to the right department automatically.
              </motion.p>
              <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row justify-center gap-4 mt-8 w-full sm:w-auto">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-base shadow-lg shadow-primary/30 transition-all hover:scale-105">
                    Report an Issue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-base bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all hover:scale-105">
                    Access Dashboard
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* AI Powered Section */}
        <section id="ai" className="w-full py-20 md:py-32 bg-white dark:bg-slate-900 border-y">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeUpVariant}
                className="space-y-6"
              >
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                  Smart AI Routing
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-slate-900 dark:text-white">
                  Zero delays. <br/> Infinite efficiency.
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  Our platform uses advanced Machine Learning models to automatically categorize and prioritize complaints as soon as they are submitted.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Auto-categorization of issues from text and images.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Intelligent priority scoring based on urgency and impact.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Instant routing to the correct municipal department.</span>
                  </li>
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative mx-auto w-full max-w-[500px] aspect-square"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-full blur-3xl"></div>
                <div className="relative h-full w-full bg-white dark:bg-slate-800 rounded-2xl border shadow-xl flex items-center justify-center p-8">
                  <BrainCircuit className="h-32 w-32 text-primary" strokeWidth={1} />
                  <div className="absolute top-1/4 -left-6 bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> High Priority
                  </div>
                  <div className="absolute bottom-1/3 -right-6 bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" /> Sector 4 Mapped
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">Everything you need to report efficiently</h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
                A complete toolkit designed for modern citizens and responsive city authorities.
              </p>
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[
                { icon: MapPin, title: "Location Tagging", desc: "Pinpoint exact coordinates for faster response times using GPS." },
                { icon: ShieldCheck, title: "Transparent Tracking", desc: "Track every step of the resolution process with real-time updates." },
                { icon: BarChart3, title: "Data Insights", desc: "Interactive dashboards helping authorities allocate resources efficiently." },
                { icon: Clock, title: "24/7 Availability", desc: "Report issues anytime, anywhere directly from your mobile device." },
                { icon: Users, title: "Community Voting", desc: "Upvote community issues to increase visibility and priority." },
                { icon: MessageSquare, title: "Direct Feedback", desc: "Communicate directly with city officials regarding your complaints." },
              ].map((feature, i) => (
                <motion.div key={i} variants={fadeUpVariant}>
                  <Card className="h-full border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30">
                    <CardHeader>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center mb-4">
                        <feature.icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-500 dark:text-slate-400">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-20 md:py-32 bg-slate-900 text-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">How it works</h2>
              <p className="mt-4 text-lg text-slate-400">
                From identifying a problem to fixing it, the process is seamless.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-slate-700 -z-10"></div>
              {[
                { step: "01", title: "Spot & Report", desc: "Take a photo and provide a brief description of the issue." },
                { step: "02", title: "AI Analyzes", desc: "Our AI categorizes and routes the ticket to the correct department." },
                { step: "03", title: "Authorities Act", desc: "Workers are dispatched with the exact location and details." },
                { step: "04", title: "Issue Resolved", desc: "You receive a notification once the issue is permanently fixed." },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.5 }}
                  className="flex flex-col items-center text-center relative z-10"
                >
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-2xl font-bold text-primary mb-6 shadow-xl">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="w-full py-20 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "25k+", label: "Issues Resolved" },
                { number: "40%", label: "Faster Response Time" },
                { number: "150+", label: "Cities Integrated" },
                { number: "100k+", label: "Active Citizens" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center space-y-2">
                  <h3 className="text-4xl md:text-5xl font-extrabold tracking-tighter">{stat.number}</h3>
                  <p className="text-primary-foreground/80 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full py-20 md:py-32 bg-slate-50 dark:bg-slate-950">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">Trusted by communities</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Sarah J.", role: "Citizen", text: "I reported a broken streetlight and it was fixed the next day. The tracking feature is fantastic!" },
                { name: "Mark T.", role: "City Official", text: "The AI routing saves us hours of manual sorting. We can now focus directly on solving the problems." },
                { name: "Elena R.", role: "Community Leader", text: "This platform has brought transparency to our local government. Highly recommend it to all neighborhoods." }
              ].map((testimonial, i) => (
                <Card key={i} className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <p className="text-slate-600 dark:text-slate-400 italic">"{testimonial.text}"</p>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                          {testimonial.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                          <p className="text-xs text-slate-500">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t py-12 md:py-16">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <Link className="flex items-center gap-2 mb-4" to="/">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Smart Civic AI</span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                Making cities smarter, safer, and more responsive to citizen needs through AI-powered technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-primary">How it works</a></li>
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">For Cities</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-primary">API Documentation</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
            <p>© 2026 Smart Civic AI Platform. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
