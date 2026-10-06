import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { PublishedDirectionSnapshot } from "@/lib/data";

export type ReviewStatus = "published" | "changes_requested" | "approved" | "closed";
export type AccessLevel = "VIEW" | "COMMENT" | "EDIT";

export interface FirestoreReview {
  id: string;
  projectId: string;
  directionId: string;
  versionId: string;
  status: ReviewStatus;
  token: string;
  accessLevel: AccessLevel;
  publishedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreReviewShare {
  token: string;
  reviewId: string;
  projectId: string;
  directionId: string;
  versionId: string;
  projectName: string;
  clientName: string;
  directionName: string;
  accessLevel: AccessLevel;
  snapshot: PublishedDirectionSnapshot;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export async function createReviewAndShare(
  projectId: string,
  directionId: string,
  versionId: string,
  snapshot: PublishedDirectionSnapshot,
  projectName: string,
  clientName: string,
  accessLevel: AccessLevel = "COMMENT"
): Promise<{ review: FirestoreReview; share: FirestoreReviewShare }> {
  const reviewsRef = collection(db, "projects", projectId, "reviews");
  const reviewId = `rev-${directionId}-${Date.now()}`;
  const reviewRef = doc(reviewsRef, reviewId);

  // Generate random opaque token
  const token = `rev_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const shareRef = doc(db, "reviewShares", token);

  const reviewDoc: FirestoreReview = {
    id: reviewId,
    projectId,
    directionId,
    versionId,
    status: "published",
    token,
    accessLevel,
    publishedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Safe client boundary projection — contains ONLY the published direction snapshot
  const shareDoc: FirestoreReviewShare = {
    token,
    reviewId,
    projectId,
    directionId,
    versionId,
    projectName,
    clientName,
    directionName: snapshot.name,
    accessLevel,
    snapshot,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await Promise.all([
    setDoc(reviewRef, reviewDoc),
    setDoc(shareRef, shareDoc),
  ]);

  return { review: reviewDoc, share: shareDoc };
}

export async function resolveReviewToken(token: string): Promise<FirestoreReviewShare | null> {
  try {
    const shareRef = doc(db, "reviewShares", token);
    const snap = await getDoc(shareRef);
    if (!snap.exists()) return null;
    const data = snap.data() as FirestoreReviewShare;
    if (!data.active) return null;
    return data;
  } catch (error) {
    console.error("Error resolving review token from Firestore:", error);
    return null;
  }
}

export async function updateReviewStatus(
  projectId: string,
  reviewId: string,
  status: ReviewStatus
): Promise<void> {
  const reviewRef = doc(db, "projects", projectId, "reviews", reviewId);
  await updateDoc(reviewRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function getProjectReviews(projectId: string): Promise<FirestoreReview[]> {
  try {
    const reviewsRef = collection(db, "projects", projectId, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      projectId,
      ...d.data(),
    })) as FirestoreReview[];
  } catch (error) {
    console.error("Error fetching project reviews from Firestore:", error);
    return [];
  }
}
