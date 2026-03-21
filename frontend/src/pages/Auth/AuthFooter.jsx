import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

function AuthSocialSection({ text, linkText, onLinkClick }) {
  const { theme } = useTheme();

  return (
    <div className="mt-6 flex flex-col items-center w-full">
      <div className="relative flex py-5 items-center w-full">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm">Or</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <div className="flex gap-4 w-full">
        <Button variant="outline" className="w-full font-semibold shadow-sm hover:shadow-md transition-shadow">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          Google
        </Button>
        <Button variant="outline" className="w-full font-semibold shadow-sm hover:shadow-md transition-shadow">
           <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
             <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
          </svg>
          Facebook
        </Button>
      </div>

      <div className="mt-8 text-sm text-foreground">
        <span>{text}</span>
        <button type="button" onClick={onLinkClick} className="ml-2 font-bold text-primary hover:underline hover:text-primary/80 transition-colors">
          {linkText}
        </button>
      </div>
    </div>
  );
}

export default AuthSocialSection;
