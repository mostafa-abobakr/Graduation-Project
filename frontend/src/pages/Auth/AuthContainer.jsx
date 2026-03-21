import React, { useState } from "react";
import Lottie from "lottie-react";

function AuthContainer({ img, children, isLottie = false }) {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="w-full min-h-screen bg-background flex items-center justify-center p-4">
      <div className="shadow-lg rounded-xl flex flex-col md:flex-row justify-evenly items-center p-8 w-full sm:w-[90%] md:w-[90%] h-auto min-h-[90%] md:h-[95%] bg-card text-card-foreground overflow-hidden">
        
        <div className="hidden md:flex flex-1 justify-center items-center p-8 h-full">
          {isLottie ? (
            <div className="w-full max-w-[400px] hover:animate-pulse transition-all">
              <Lottie animationData={img} />
            </div>
          ) : (
            <img src={img} alt="Authentication" className="w-[85%] max-h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
          )}
        </div>

        <div className="hidden md:flex flex-col items-center h-full px-6">
          <div className="h-[90%] w-px bg-border my-auto"></div>
        </div>

        <div className="flex-1 p-4 md:p-8 flex flex-col justify-center w-full max-w-[500px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthContainer;
