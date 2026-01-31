import styles from "./AuthLayout.module.css";

function AuthLayout({ img, children }) {
  return (
    <div className={styles.authWrapper}>
      <div className={styles.card}>
        <img src={img} alt="" className={styles.img} />
        <div className={styles.divider}></div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
