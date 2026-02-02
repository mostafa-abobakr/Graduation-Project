import { useRef } from "react";
import styles from "./OtpInput.module.css";

function OtpInput({ length = 6, onComplete }) {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/, "");

    e.target.value = value;

    if (value && index < length - 1) {
      inputsRef.current[index + 1].focus();
    }

    const code = inputsRef.current.map((input) => input.value).join("");

    if (code.length === length) {
      onComplete(code);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  return (
    <div className={styles.wrapper}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          type="text"
          maxLength="1"
          ref={(el) => (inputsRef.current[index] = el)}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={styles.input}
        />
      ))}
    </div>
  );
}

export default OtpInput;
