export type GraphComment = {
  id: string;
  message?: string;
  created_time: string;
  like_count?: number;
  from?: { id?: string };
};
