import React from 'react'
import {Link}from "react-router-dom"
import styles from "./Button.module.css"
const Button = ({text,path,style}) => {
  return (
    <button className={styles.button} style={style} >
      <Link to={path}>{text}</Link>
    </button>
  );
}

export default Button