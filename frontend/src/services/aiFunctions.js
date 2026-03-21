import axios from "axios";

export async function fetchStatistics() {
    return await axios.get(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/revenue/2",
        {
            headers: { Accept: "application/json" },
        }
    ).then(res => res.data); // or just return res if you prefer
}
export async function CostReduction() {
    return await axios.get(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/cost-reduction/2",
        {
            headers: { Accept: "application/json" },
        }
    ).then(res => res.data); // or just return res if you prefer
}
export const samplePeaks = {
    peak_hours: [
        {
            "hour": "17:00",
            "order_count": 665,
            "revenue": 140022
        },
        {
            "hour": "18:00",
            "order_count": 658,
            "revenue": 137161
        },
        {
            "hour": "19:00",
            "order_count": 600,
            "revenue": 123661
        }
    ],
    peak_days: [
        {
            "day": "Saturday",
            "order_count": 1055,
            "revenue": 217639
        },
        {
            "day": "Sunday",
            "order_count": 1001,
            "revenue": 204761
        },
        {
            "day": "Wednesday",
            "order_count": 655,
            "revenue": 134637
        }
    ]
}
export async function fetchSalesProfit() {
    return await axios.get(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/sales-profit-chart/2",
        {
            headers: { Accept: "application/json" },
        }
    ).then(res => res.data); // or just return res if you prefer
}
export async function fetchAlerts() {
    return await axios.get(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/alerts/2",
        {
            headers: { Accept: "application/json" },
        }
    ).then(res => res.data); // or just return res if you prefer
}
export async function fetchPeakTimes() {
    return await axios.get(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/peaks/2",
        {
            headers: { Accept: "application/json" },
        }
    ).then(res => res.data); // or just return res if you prefer
}
export async function menu() {
    return await axios.get(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/menu/performance/2",
        {
            headers: { Accept: "application/json" },
        }
    ).then(res => res.data); // or just return res if you prefer
}
export async function fetchOrdersBreakdown() {
    return await axios.get(
        "https://youseef-awaad-zerobite-ai-engine.hf.space/analytics/revenue/2",
        {
            headers: { Accept: "application/json" },
        }
    ).then(res => res.data); // or just return res if you prefer
}