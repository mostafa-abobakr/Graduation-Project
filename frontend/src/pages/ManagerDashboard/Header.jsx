import React from "react";

const Header = () => {
  return (
    <header
      className="
        flex 
        flex-row 
        justify-between 
        items-center 
        px-4 
        py-3
        border-b 
        border-border/60 
        bg-background 
        backdrop-blur-sm
      "
    >
      <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
        Manager Dashboard
      </h1>

      {/* If you had icons or profile buttons in MUI's IconButton, 
          they would go here in this flex container */}
    </header>
  );
};

export default Header;
