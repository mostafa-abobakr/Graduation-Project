import React from "react";
import { TextField } from "@mui/material";

const Input = ({
  type = "text",
  label,
  autoComplete,
  InputProps,
  ...props
}) => {
  const getAutoComplete = (type) => {
    if (type === "email") return "email";
    if (type === "password") return "current-password";
    return undefined;
  };

  return (
    <TextField
      margin="normal"
      required
      fullWidth
      id={type}
      label={label}
      name={type}
      type={type}
      autoComplete={autoComplete ?? getAutoComplete(type)}
      InputProps={{
        ...InputProps,
        sx: {
          color: "var(--color-text-primary)",
          backgroundColor: "var(--color-background-paper)",
          borderRadius: "8px",
          transition: "all 0.3s ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--color-grey-500)",
            transition: "border-color 0.3s ease",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--color-primary-light)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--color-primary-main)",
            boxShadow: "0 0 0 2px rgba(0, 82, 204, 0.2)",
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--color-error-main)",
          },
        },
      }}
      InputLabelProps={{
        sx: {
          color: "var(--color-text-secondary)",
          "&.Mui-focused": {
            color: "var(--color-primary-main)",
          },
          "&.Mui-error": {
            color: "var(--color-error-main)",
          },
        },
      }}
      sx={{
        "& .MuiInputBase-input": {
          color: "var(--color-text-primary)",
          padding: "14px",
          "&::placeholder": {
            color: "var(--color-text-secondary)",
            opacity: 0.7,
          },
        },
        "& .MuiFormHelperText-root": {
          color: "var(--color-text-secondary)",
          "&.Mui-error": {
            color: "var(--color-error-main)",
          },
        },
      }}
      {...props}
    />
  );
};

export default Input;
