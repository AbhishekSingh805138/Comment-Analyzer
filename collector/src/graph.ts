import axios from 'axios';
import type { GraphComment } from './types.js';

const BASE = 'https://graph.facebook.com/v18.0';
const TOKEN = process.env.FB_ACCESS_TOKEN!;

export async function fetchComments(postId: string): Promise<GraphComment[]> {
  const fields = 'comments.limit(500){id,message,created_time,like_count,from}';
  const url = `${BASE}/${postId}?fields=${encodeURIComponent(fields)}&access_token=${TOKEN}`;
  const { data } = await axios.get(url);
  const comments = data?.comments?.data || [];
  return comments as GraphComment[];
}
