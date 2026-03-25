import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Brain, Leaf, TrendingDown, TrendingUp, Users, Zap, Check, Star } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ROUTES } from "@/routes/ROUTES";
const stats = [
  { label: "Food Waste Reduced", value: "32%", icon: TrendingDown },
  { label: "Revenue Increase", value: "18%", icon: TrendingUp },
  { label: "Restaurants Active", value: "2,400+", icon: Users },
  { label: "Predictions Daily", value: "1.2M", icon: Brain },
];

const features = [
  { icon: Brain, title: "AI Demand Forecasting", description: "Predict customer demand hours ahead using machine learning trained on your restaurant's data." },
  { icon: BarChart3, title: "Waste Analytics", description: "Track and reduce food waste with real-time analytics and actionable recommendations." },
  { icon: TrendingUp, title: "Revenue Optimization", description: "Maximize profit margins by understanding which items drive revenue and when." },
  { icon: Zap, title: "Smart Prep Guides", description: "Get AI-generated preparation quantities for every menu item, every hour." },
];

const steps = [
  { step: "01", title: "Connect Your POS", description: "Integrate with your existing point-of-sale system in minutes." },
  { step: "02", title: "AI Learns Patterns", description: "Our ML models analyze your historical data to find demand patterns." },
  { step: "03", title: "Get Predictions", description: "Receive hourly demand forecasts and preparation recommendations." },
  { step: "04", title: "Reduce Waste", description: "Follow AI insights to cut waste by up to 40% and boost revenue." },
];

const testimonials = [
  { name: "Sarah Chen", role: "Owner, The Green Kitchen", quote: "zeroBite AI cut our food waste by 35% in the first month. The predictions are incredibly accurate.", rating: 5 },
  { name: "Marco Rossi", role: "Head Chef, Bella Italia", quote: "I know exactly how much to prep each morning. No more guessing, no more throwing away food.", rating: 5 },
  { name: "James Wright", role: "Operations Manager, BurgerCo", quote: "The ROI was immediate. We saved $2,400 in the first month alone across our 3 locations.", rating: 5 },
];

const pricing = [
  { name: "Starter", price: 49, description: "For single-location restaurants", features: ["1 restaurant", "Basic demand forecasting", "Waste tracking", "7-day predictions", "Email support"] },
  { name: "Professional", price: 129, description: "For growing restaurants", features: ["Up to 5 locations", "Advanced AI predictions", "Menu analytics", "Revenue optimization", "Priority support", "API access"], popular: true },
  { name: "Enterprise", price: 299, description: "For restaurant chains", features: ["Unlimited locations", "Custom ML models", "White-label dashboard", "Dedicated account manager", "SLA guarantee", "Custom integrations"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Leaf className="h-4 w-4 text-primary" /></div><span className="text-base font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>zeroBite</span></div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground"><a href="#features" className="hover:text-foreground transition-colors">Features</a><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></div>
          <div className="flex items-center gap-2"><ThemeToggle /><Link to={ROUTES.LOGIN}><Button variant="ghost" size="sm">Log In</Button></Link><Link to={ROUTES.SIGNUP}><Button size="sm">Start Free Trial</Button></Link></div>
        </div>
      </nav>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm mb-8"><Zap className="h-3.5 w-3.5" /> AI-Powered Restaurant Intelligence</div>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.1] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>Reduce Food Waste<br /><span className="gradient-text">Using AI Predictions</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">Predict customer demand, optimize food preparation, and cut waste by up to 40%. Built for modern restaurants that care about profit and the planet.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup"><Button size="lg" className="text-sm px-8 h-11 rounded-lg">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/dashboard"><Button variant="outline" size="lg" className="text-sm px-8 h-11 rounded-lg">View Demo Dashboard</Button></Link>
          </div>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (<Card key={stat.label} className="p-6 text-center bg-card border-border/60 premium-shadow"><stat.icon className="h-5 w-5 text-primary mx-auto mb-3" /><div className="stat-number text-foreground mb-1">{stat.value}</div><div className="text-sm text-muted-foreground">{stat.label}</div></Card>))}
        </div>
      </section>
      <section id="features" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>Intelligent Restaurant Analytics</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">Everything you need to predict demand, reduce waste, and maximize revenue.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f) => (<Card key={f.title} className="p-7 bg-card border-border/60 hover:border-primary/30 transition-all premium-shadow"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><f.icon className="h-5 w-5 text-primary" /></div><h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p></Card>))}
          </div>
        </div>
      </section>
      <section id="how-it-works" className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s) => (<div key={s.step} className="text-center"><div className="text-4xl font-bold text-primary/15 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.step}</div><h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p></div>))}
          </div>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>Trusted by Restaurants</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t) => (<Card key={t.name} className="p-7 bg-card border-border/60 premium-shadow"><div className="flex gap-0.5 mb-4">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div><p className="text-foreground text-sm mb-6 leading-relaxed">"{t.quote}"</p><div><div className="font-semibold text-foreground text-sm">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div></Card>))}
          </div>
        </div>
      </section>
      <section id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-center mb-14">Start free. Scale when you're ready.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {pricing.map((p) => (<Card key={p.name} className={`p-7 bg-card border-border/60 relative premium-shadow ${p.popular ? "border-primary glow-green" : ""}`}>{p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Most Popular</div>}<h3 className="text-lg font-semibold text-foreground mb-1">{p.name}</h3><p className="text-xs text-muted-foreground mb-5">{p.description}</p><div className="mb-5"><span className="stat-number text-foreground">${p.price}</span><span className="text-muted-foreground text-sm">/mo</span></div><ul className="space-y-2.5 mb-7">{p.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary shrink-0" />{f}</li>))}</ul><Link to="/signup"><Button className="w-full" variant={p.popular ? "default" : "outline"}>Get Started</Button></Link></Card>))}
          </div>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Ready to Reduce Waste?</h2>
          <p className="text-muted-foreground mb-8">Join 2,400+ restaurants already saving money and the planet with AI predictions.</p>
          <Link to="/signup"><Button size="lg" className="text-sm px-8 h-11 rounded-lg">Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5"><div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center"><Leaf className="h-3.5 w-3.5 text-primary" /></div><span className="font-semibold text-foreground text-sm">zeroBite AI</span></div>
          <p className="text-xs text-muted-foreground">© 2026 zeroBite AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
