// Lines 1-3: Import required modules
import axios from 'axios';                    // HTTP client for API calls
import 'dotenv/config';                       // Load environment variables
import type { GraphComment } from './types.js';  // Import comment type

// Lines 5-6: Facebook API configuration
const BASE = 'https://graph.facebook.com/v18.0';  // Facebook Graph API base URL
const TOKEN = process.env.FB_ACCESS_TOKEN!;        // Access token from environment

// Lines 8-14: Function to fetch comments from Facebook
export async function fetchComments(postId: string): Promise<GraphComment[]> {
  // Define which fields to fetch from Facebook
  const fields = 'comments.limit(500){id,message,created_time,like_count,from}';
  
  // Build complete API URL with parameters
  const url = `${BASE}/${postId}?fields=${encodeURIComponent(fields)}&access_token=${TOKEN}`;
  
  // Make HTTP GET request to Facebook API
  const { data } = await axios.get(url);
  
  // Extract comments from response (handle missing data)
  const comments = data?.comments?.data || [];
  
  // Return typed comment array
  return comments as GraphComment[];
}
