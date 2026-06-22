import { Card } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { Link } from "react-router-dom"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { cn } from "@/lib/utils"

function AuthContainer({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
  className,
  maxWidth = "max-w-sm"
}) {
  return (
    <div className={cn("min-h-screen bg-background flex items-center justify-center p-6 w-full", className)}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className={cn("w-full", maxWidth)}>
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Leaf className="h-4.5 w-4.5 text-primary" />
            </div>
            <span
              className="text-lg font-bold text-foreground"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              ZeroWaste
            </span>
          </Link>

          {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>

        {/* Card Content */}
        <Card className="p-5 border-border/60 premium-shadow-md ">
          {children}
        </Card>

        {/* Footer */}
        {footerText && footerLinkText && footerLinkTo && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            {footerText}{" "}
            <Link to={footerLinkTo} className="text-primary hover:underline font-medium">
              {footerLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default AuthContainer
