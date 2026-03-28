import React from "react";

const AuthForm = ({ header, children, onSubmit, ...props }) => {
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
      </div>
    </form>
  );
};

export default AuthForm;
