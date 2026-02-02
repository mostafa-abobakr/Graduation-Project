import React, { useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";
import styles from "./Dashboard.module.css";

// --- MOCK DATA ---
const DAILY_DATA = [
  { label: "Mon", orders: 65 },
  { label: "Tue", orders: 100 },
  { label: "Wed", orders: 35 },
  { label: "Thu", orders: 60 },
  { label: "Fri", orders: 75 },
  { label: "Sat", orders: 90 },
  { label: "Sun", orders: 68 },
];

const HOURLY_DATA = [
  { label: "10AM", orders: 20 },
  { label: "11AM", orders: 45 },
  { label: "12PM", orders: 80 },
  { label: "1PM", orders: 75 },
  { label: "2PM", orders: 50 },
  { label: "3PM", orders: 30 },
  { label: "4PM", orders: 40 },
];

const Forcast = () => {
  // Only viewMode state remains
  const [viewMode, setViewMode] = useState("daily");

  // Determine which data to show
  const currentData = viewMode === "daily" ? DAILY_DATA : HOURLY_DATA;
  const graphTitle = viewMode === "daily" ? "Orders This Week" : "Orders Today";

  return (
    <main className={styles.dashboardContainer}>
      {/* HEADER */}
      <header className={styles.header}>
        <h2>Forecast</h2>
        <div className={styles.toggleContainer}>
          <div
            className={`${styles.toggleGlider} ${viewMode === "daily" ? styles.daily : styles.hourly}`}
          />

          {/* Button 1: Hourly */}
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === "hourly" ? styles.active : ""}`}
            onClick={() => setViewMode("hourly")}
          >
            Hourly view
          </button>

          {/* Button 2: Daily */}
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === "daily" ? styles.active : ""}`}
            onClick={() => setViewMode("daily")}
          >
            Daily view
          </button>
        </div>
      </header>

      {/* SUMMARY CARD */}
      <section className={styles.summaryCard} aria-label="Order Summary">
        <div className={styles.summaryText}>
          <p>Expected Orders Today</p>
          <h1>247</h1>
          <div className={styles.summaryFooter}>
            <span>This Week : 1,680</span>
            <span className={styles.accuracy}>94.2% Accuracy</span>
          </div>
        </div>
        <div className={styles.summaryIcon} aria-hidden="true">
          <svg
            width="45"
            height="45"
            viewBox="0 0 45 45"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.125 19.2937C14.3187 18.1627 15.9083 17.5448 17.5525 17.5728C19.1967 17.6009 20.7644 18.2726 21.9188 19.4437L25.9313 23.4562C26.1046 23.617 26.3323 23.7064 26.5688 23.7064C26.8052 23.7064 27.0329 23.617 27.2063 23.4562L33.9 16.7437C33.9446 16.704 33.9796 16.6547 34.0024 16.5995C34.0251 16.5443 34.035 16.4846 34.0312 16.425C34.0325 16.3657 34.0214 16.3068 33.9989 16.2519C33.9763 16.1971 33.9426 16.1475 33.9 16.1062L30.7125 12.9375C30.4861 12.6749 30.3369 12.3547 30.2816 12.0124C30.2262 11.6702 30.2669 11.3192 30.399 10.9987C30.5311 10.6781 30.7495 10.4005 31.0299 10.1966C31.3104 9.9927 31.6418 9.87056 31.9875 9.84374H42.8438C43.341 9.84374 43.8179 10.0413 44.1696 10.3929C44.5212 10.7445 44.7188 11.2215 44.7188 11.7187V22.5C44.6894 22.8422 44.5667 23.1698 44.3639 23.4471C44.1611 23.7243 43.886 23.9405 43.5687 24.072C43.2515 24.2036 42.9041 24.2455 42.5647 24.1931C42.2252 24.1407 41.9066 23.9961 41.6437 23.775L38.3813 20.625C38.2946 20.5446 38.1807 20.4999 38.0625 20.4999C37.9443 20.4999 37.8304 20.5446 37.7438 20.625L31.05 27.2812C29.843 28.4343 28.238 29.0777 26.5688 29.0777C24.8995 29.0777 23.2945 28.4343 22.0875 27.2812L18.0938 23.2687C17.9257 23.105 17.7003 23.0133 17.4656 23.0133C17.231 23.0133 17.0056 23.105 16.8375 23.2687L4.9125 34.5187C4.3945 34.9918 3.71176 35.2429 3.01072 35.2184C2.30968 35.1939 1.64617 34.8956 1.1625 34.3875C0.689492 33.8695 0.438318 33.1867 0.462855 32.4857C0.487391 31.7847 0.785684 31.1212 1.29375 30.6375L13.125 19.2937Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* GRAPH SECTION */}
      <section className={styles.ordersGraphs}>
        <div className={styles.ordersTitle}>{graphTitle}</div>

        {/* Fixed height container to prevent Recharts collapse */}
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart
              data={currentData}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#000", fontSize: 14, fontWeight: "700" }}
                dy={5}
              />
              <Bar
                dataKey="orders"
                fill="#00C0E8"
                barSize={40}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* PEAK HOURS SECTION */}
      <section
        className={styles.peakContainer}
        aria-label="Peak Operating Hours"
      >
        <div className={styles.peakHeader}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 12.25C1 13.7274 1.29099 15.1903 1.85636 16.5552C2.42172 17.9201 3.25039 19.1603 4.29505 20.205C5.33971 21.2496 6.5799 22.0783 7.94481 22.6436C9.30972 23.209 10.7726 23.5 12.25 23.5C13.7274 23.5 15.1903 23.209 16.5552 22.6436C17.9201 22.0783 19.1603 21.2496 20.205 20.205C21.2496 19.1603 22.0783 17.9201 22.6436 16.5552C23.209 15.1903 23.5 13.7274 23.5 12.25C23.5 9.26631 22.3147 6.40483 20.205 4.29505C18.0952 2.18526 15.2337 1 12.25 1C9.26631 1 6.40483 2.18526 4.29505 4.29505C2.18526 6.40483 1 9.26631 1 12.25Z"
              stroke="#FF8D28"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12.25 6V12.25L16 16"
              stroke="#FF8D28"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <span>Peak Hours</span>
        </div>

        <ul className={styles.peakStats}>
          <li className={styles.statItem}>
            <h2>12-1 PM</h2>
            <p>Lunch Rush</p>
          </li>
          <li className={styles.statItem}>
            <h2>7-8 PM</h2>
            <p>Dinner Peak</p>
          </li>
          <li className={styles.statItem}>
            <h2>65</h2>
            <p>Max Orders/Hours</p>
          </li>
        </ul>
      </section>
    </main>
  );
};

export default Forcast;
