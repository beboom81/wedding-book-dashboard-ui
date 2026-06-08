export interface Stats {
  present: number;
  absent: number;
  likes: number;
  comments: number;
}

export interface UserProfile {
  name: string;
  email: string;
  access_key: string;
  can_edit: boolean;
  can_delete: boolean;
  can_reply: boolean;
  is_confetti_animation: boolean;
  is_filter: boolean;
  tenor_key: string | null;
  tz: string | null;
}

export interface CommentItem {
  uuid: string;
  name: string;
  presence: boolean;
  comment: string | null;
  gif_url: string | null;
  like_count: number;
  is_admin: boolean | null;
  created_at: string;
  parent_id: string | null;
  replies?: CommentItem[];
  own?: string;
}

export interface CommentListV2 {
  lists: CommentItem[];
  count: number;
}
