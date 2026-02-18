export type ApiEnvelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
  traceId?: string;
};

export type TagDTO = {
  tagId: number;
  name: string;
  createdAt?: string;
};

export type PostMediaDTO = {
  mediaObjectId: number;
  kind: string;
};

export type PostDTO = {
  postId: number;
  title?: string;
  body: string;
  tags?: string[];
  locationName?: string;
  lng?: number;
  lat?: number;
  occurredAt?: string;
  media?: PostMediaDTO[];
  authorUserOneId: string;
  isPublic: boolean;
  isIndexable: boolean;
  commentCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CommentDTO = {
  commentId: number;
  postId: number;
  body: string;
  authorUserOneId: string;
  parentCommentId?: number | null;
  createdAt?: string;
};

export type WikiEntryDTO = {
  entryId: number;
  slug: string;
  title: string;
  summary?: string;
  body?: string | null;
  tags?: string[];
  isPublic: boolean;
  isIndexable: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PresignUploadRequest = {
  filename: string;
  contentType: string;
  sizeBytes?: number;
};

export type PresignUploadResponse = {
  mediaObjectId: number;
  objectKey: string;
  putUrl: string;
  mock: boolean;
};

export type GetMediaResponse = {
  mediaObjectId: number;
  bucket: string;
  objectKey: string;
  contentType: string;
  sizeBytes?: number | null;
  getUrl: string;
  mock: boolean;
};

