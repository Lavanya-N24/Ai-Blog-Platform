// Central API configuration
// Set NEXT_PUBLIC_API_URL in your .env.local or Vercel environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default API_BASE_URL;
