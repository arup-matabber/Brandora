import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface FirestoreComment {
  id: string;
  reviewId: string;
  directionId?: string;
  versionId?: string;
  authorId: string;
  authorName: string;
  parentCommentId?: string | null;
  body: string;
  targetObjectId?: string | null;
  x?: number | null;
  y?: number | null;
  resolved: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface AddCommentDTO {
  id?: string;
  reviewId: string;
  directionId?: string;
  versionId?: string;
  authorId: string;
  authorName: string;
  parentCommentId?: string | null;
  body: string;
  targetObjectId?: string | null;
  x?: number | null;
  y?: number | null;
}

export async function getReviewComments(
  projectId: string,
  reviewId: string
): Promise<FirestoreComment[]> {
  try {
    const commentsRef = collection(db, "projects", projectId, "reviews", reviewId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      reviewId,
      ...d.data(),
    })) as FirestoreComment[];
  } catch (error) {
    console.error("Error fetching review comments from Firestore:", error);
    return [];
  }
}

export async function addReviewComment(
  projectId: string,
  reviewId: string,
  dto: AddCommentDTO
): Promise<FirestoreComment> {
  const commentsRef = collection(db, "projects", projectId, "reviews", reviewId, "comments");
  const commentId = dto.id || `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const commentRef = doc(commentsRef, commentId);

  const commentDoc: FirestoreComment = {
    id: commentId,
    reviewId,
    directionId: dto.directionId,
    versionId: dto.versionId,
    authorId: dto.authorId,
    authorName: dto.authorName,
    parentCommentId: dto.parentCommentId || null,
    body: dto.body.trim(),
    targetObjectId: dto.targetObjectId || null,
    x: dto.x ?? null,
    y: dto.y ?? null,
    resolved: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(commentRef, commentDoc);
  return commentDoc;
}

export async function toggleCommentResolved(
  projectId: string,
  reviewId: string,
  commentId: string,
  resolved: boolean
): Promise<void> {
  const commentRef = doc(db, "projects", projectId, "reviews", reviewId, "comments", commentId);
  await updateDoc(commentRef, {
    resolved,
    updatedAt: serverTimestamp(),
  });
}
