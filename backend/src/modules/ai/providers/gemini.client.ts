import axios from "axios";

import { env } from "../../../config/env";

export const geminiClient = axios.create({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
  params: {
    key: env.GEMINI_API_KEY,
  },
});