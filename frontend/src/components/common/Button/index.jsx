import React from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.css";
const Button = ({ text, path, style, className = "", ...props }) => {
  const buttonClasses = `${styles.button} ${className}`.trim();

  return (
    <button className={buttonClasses} style={style} {...props}>
      {path ? <Link to={path}>{text}</Link> : text}
    </button>
  );
};
export default Button;
