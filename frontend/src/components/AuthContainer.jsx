import { Card } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import MainLogo from "@/assets/logos/MainLogo";
import TextLogo from "@/assets/logos/TextLogo";
import { cn } from "@/lib/utils";

function AuthContainer({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
  className,
  maxWidth = "max-w-sm",
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background flex items-center justify-center p-6 w-full",
        className,
      )}
    >
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 rtl:left-auto rtl:right-4 sm:rtl:right-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-9 w-9 flex items-center justify-center">
            <MainLogo className="h-full w-full text-primary" />
          </div>
          <TextLogo className="h-6 w-auto text-foreground" />
        </Link>
      </div>

      <div className="absolute top-4 sm:top-6 right-4 z-10 rtl:right-auto rtl:left-4">
        <ThemeToggle />
      </div>

      <div className={cn("w-full", maxWidth)}>
        {/* Header */}
        <div className="text-center mb-8">
          {title && (
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Card Content */}
        <Card className="p-5 border-border/60 premium-shadow-md ">
          {children}
        </Card>

        {/* Footer */}
        {footerText && footerLinkText && footerLinkTo && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            {footerText}{" "}
            <Link
              to={footerLinkTo}
              className="text-primary hover:underline font-medium"
            >
              {footerLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthContainer;
