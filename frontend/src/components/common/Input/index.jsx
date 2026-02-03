import React from "react";
import { TextField, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    borderRadius: "8px",
    "& fieldset": {
      borderColor: theme.palette.grey[500],
      transition: theme.transitions.create("border-color", {
        duration: theme.transitions.duration.shorter,
      }),
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.light,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`, // 40 = 25% opacity in hex
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
  },
}));

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  error,
  helperText,
  ...props
}) => {
  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <StyledTextField
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
        variant="outlined"
        fullWidth
        {...props}
      />
    </Box>
  );
};

export default Input;
