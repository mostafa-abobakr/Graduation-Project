import { useTheme } from "@/components/shared/ThemeProvider";

export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    tooltip: {
      contentStyle: {
        backgroundColor: isDark ? "hsl(224 18% 10%)" : "hsl(0 0% 100%)",
        border: `1px solid ${isDark ? "hsl(224 12% 17%)" : "hsl(220 13% 91%)"}`,
        borderRadius: "8px",
        color: isDark ? "hsl(210 20% 93%)" : "hsl(220 20% 12%)",
        boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
      },
      labelStyle: { color: isDark ? "hsl(220 10% 50%)" : "hsl(220 10% 46%)" },
    },
    grid: isDark ? "hsl(224 12% 17%)" : "hsl(220 13% 91%)",
    tick: {
      fill: isDark ? "hsl(220 10% 50%)" : "hsl(220 10% 46%)",
      fontSize: 12,
    },
  };
}
