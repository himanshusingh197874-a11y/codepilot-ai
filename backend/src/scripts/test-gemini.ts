import axios from "axios";
import "dotenv/config";

async function main() {
  const client = axios.create({
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    params: {
      key: process.env.GEMINI_API_KEY,
    },
  });

  try {
    const { data } = await client.get("/models");

    console.log(JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
  }
}

main();