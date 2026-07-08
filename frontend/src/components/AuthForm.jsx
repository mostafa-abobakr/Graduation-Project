import React from "react";
import { Link } from "react-router-dom";

const AuthForm = ({ header, children, onSubmit,footer,footerLink, ...props }) => {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      {...props}
      className="w-full h-full flex justify-center items-center py-5"
    >
      <div className="flex flex-col items-start w-full max-w-[600px] rounded-lg">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          {header}
        </h1>
        <div className="w-full">
          {children}
        </div>
        <p className="text-sm text-muted-foreground mt-4">{footer} <Link to={footerLink} className="text-primary">{footerLink}</Link></p>
      </div>
    </form>
  );
};

export default AuthForm;
