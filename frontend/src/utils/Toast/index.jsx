import styles from "./Toast.module.css";
import { useToastContext } from "@/context/ToastContext";

 const Toast = () => {
  const { toasts, removeToast } = useToastContext();

  if (!toasts.length) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast}>
          <div className={styles.content}>
            {toast.title && <h4 className={styles.title}>{toast.title}</h4>}
            {toast.description && ( <p className={styles.description}>{toast.description}</p> )}
          </div>
          <button onClick={() => removeToast(toast.id)} className={styles.closeButton} aria-label="Close toast" > &times; </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;