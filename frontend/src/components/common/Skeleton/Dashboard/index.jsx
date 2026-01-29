import styles from "./skeleton.module.css";

function DashboardSkeleton() {
  return (
    <div className={styles.dashboardSkeleton}>
      {/* ======left nav===== */}
      <div className={`${styles.section} ${styles.leftNav}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`${styles.listImg} ${styles.skeleton}`}></div>
        ))}
      </div>

      <div className={styles.rightNav}>
        {/* ===== TOP NAV ROW ===== */}
        <div className={styles.topNavRow}>
          <div className={styles.section}>
            <div className={`${styles.skTitle} ${styles.skeleton}`}></div>
            <div className={`${styles.chartBox} ${styles.skeleton}`}></div>
          </div>
        </div>

        {/* ===== TOP ROW ===== */}
        <div className={styles.topRow}>
          {/* Total Income */}
          <div className={styles.section}>
            <div className={`${styles.skTitle} ${styles.skeleton}`}></div>
            <div className={`${styles.skCircle} ${styles.skeleton}`}></div>
            <div
              className={`${styles.skLine} ${styles.skeleton} ${styles.w60}`}
            ></div>
            <div
              className={`${styles.skLine} ${styles.skeleton} ${styles.w40}`}
            ></div>
          </div>

          {/* Total Balance */}
          <div className={styles.section}>
            <div className={`${styles.skTitle} ${styles.skeleton}`}></div>
            <div
              className={`${styles.skLine} ${styles.skeleton} ${styles.w60}`}
            ></div>
            <div
              className={`${styles.skLine} ${styles.skeleton} ${styles.w40}`}
            ></div>
            <div
              className={`${styles.skLine} ${styles.skeleton} ${styles.w70}`}
            ></div>
          </div>
        </div>

        {/* ===== BOTTOM ROW ===== */}
        <div className={styles.bottomRow}>
          {/* Daily Selling */}
          <div className={styles.section}>
            <div className={`${styles.skTitle} ${styles.skeleton}`}></div>
            <div className={`${styles.chartBox} ${styles.skeleton}`}></div>
          </div>

          {/* Best Dishes */}
          <div className={styles.section}>
            <div className={`${styles.skTitle} ${styles.skeleton}`}></div>
            {[1, 2, 3, 4].map((i) => (
              <div className={styles.listRow} key={i}>
                <div className={`${styles.listImg} ${styles.skeleton}`}></div>
                <div className={styles.listContent}>
                  <div
                    className={`${styles.skLine} ${styles.skeleton} ${styles.w70}`}
                  ></div>
                  <div
                    className={`${styles.skLine} ${styles.skeleton} ${styles.w40}`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
