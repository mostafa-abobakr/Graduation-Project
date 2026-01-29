import api from "../api/axios";

export const getTomorrowPrediction = () => api.get("/predictions/tomorrow");
