import { Card } from "@/components/ui/card";
import { aiInsights } from "@/lib/mockData";
import { Brain, TrendingUp, Trash2, ChefHat, ArrowRight } from "lucide-react";
const iconMap = { demand: TrendingUp, waste: Trash2, preparation: ChefHat };
const priorityColors = { high: "bg-destructive/10 text-destructive border-destructive/20", medium: "bg-warning/10 text-warning border-warning/20", low: "bg-primary/10 text-primary border-primary/20" };
export default function AIInsightsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Brain className="h-5 w-5 text-primary" /></div><div><h1 className="text-2xl font-bold text-foreground">AI Insights</h1><p className="text-muted-foreground">Automated recommendations from your data</p></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-card border-border/60 premium-shadow"><div className="text-sm text-muted-foreground mb-2">Active Insights</div><div className="stat-number text-foreground">{aiInsights.length}</div></Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow"><div className="text-sm text-muted-foreground mb-2">Potential Weekly Savings</div><div className="stat-number text-primary">$1,120</div></Card>
        <Card className="p-5 bg-card border-border/60 premium-shadow"><div className="text-sm text-muted-foreground mb-2">Avg. Confidence</div><div className="stat-number text-foreground">{Math.round(aiInsights.reduce((s, i) => s + i.confidence, 0) / aiInsights.length)}%</div></Card>
      </div>
      <div className="space-y-3">
        {aiInsights.map((insight) => {
          const Icon = iconMap[insight.type];
          return (
            <Card key={insight.id} className="p-5 bg-card border-border/60 hover:border-primary/20 transition-all premium-shadow">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap"><h3 className="font-semibold text-foreground">{insight.title}</h3><span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[insight.priority]}`}>{insight.priority}</span></div>
                  <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{insight.description}</p>
                  <div className="flex items-center gap-6 text-sm"><span className="text-primary font-medium">{insight.impact}</span><span className="text-muted-foreground">Confidence: {insight.confidence}%</span></div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
