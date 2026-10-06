import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";
import { updateReviewStatus } from "./reviews";
import { updateDirectionStatus } from "./directions";

export type ApprovalType = "APPROVED" | "CHANGES_REQUESTED";

export interface FirestoreApproval {
  id: string;
  reviewId: string;
  projectId: string;
  directionId: string;
  directionVersionId: string;
  approvedBy: string;
  approvalType: ApprovalType;
  comment?: string;
  createdAt?: any;
}

export interface SubmitApprovalDTO {
  id?: string;
  reviewId: string;
  projectId: string;
  directionId: string;
  directionVersionId: string;
  approvedBy: string;
  approvalType: ApprovalType;
  comment?: string;
}

export async function submitApproval(
  dto: SubmitApprovalDTO
): Promise<FirestoreApproval> {
  const approvalsRef = collection(
    db,
    "projects",
    dto.projectId,
    "reviews",
    dto.reviewId,
    "approvals"
  );
  const approvalId = dto.id || `appr-${Date.now()}`;
  const approvalRef = doc(approvalsRef, approvalId);

  const approvalDoc: FirestoreApproval = {
    id: approvalId,
    reviewId: dto.reviewId,
    projectId: dto.projectId,
    directionId: dto.directionId,
    directionVersionId: dto.directionVersionId,
    approvedBy: dto.approvedBy,
    approvalType: dto.approvalType,
    comment: dto.comment || "",
    createdAt: serverTimestamp(),
  };

  await setDoc(approvalRef, approvalDoc);

  // Sync statuses across review and direction
  const reviewStatus = dto.approvalType === "APPROVED" ? "approved" : "changes_requested";
  const directionStatus = dto.approvalType === "APPROVED" ? "approved" : "changes_requested";

  await Promise.all([
    updateReviewStatus(dto.projectId, dto.reviewId, reviewStatus),
    updateDirectionStatus(dto.projectId, dto.directionId, directionStatus),
  ]);

  return approvalDoc;
}

export async function getReviewApprovals(
  projectId: string,
  reviewId: string
): Promise<FirestoreApproval[]> {
  try {
    const approvalsRef = collection(
      db,
      "projects",
      projectId,
      "reviews",
      reviewId,
      "approvals"
    );
    const q = query(approvalsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FirestoreApproval[];
  } catch (error) {
    console.error("Error fetching approvals from Firestore:", error);
    return [];
  }
}
