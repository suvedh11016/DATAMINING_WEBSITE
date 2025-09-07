import axios from "axios";

const API_BASE = "http://localhost:5000"; // backend server

export const getAllProducts = async () => {
  try {
    const res = await axios.get(`${API_BASE}/products`);
    return res.data;
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
};
