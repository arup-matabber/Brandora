import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";

export type ProjectMemberRole = "owner" | "editor" | "viewer";

export interface ProjectMember {
  userId: string;
  role: ProjectMemberRole;
  createdAt?: any;
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectMemberRole = "editor"
): Promise<ProjectMember> {
  const memberRef = doc(db, "projects", projectId, "members", userId);
  const memberData: ProjectMember = {
    userId,
    role,
    createdAt: serverTimestamp(),
  };
  await setDoc(memberRef, memberData);
  return memberData;
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  try {
    const membersRef = collection(db, "projects", projectId, "members");
    const snap = await getDocs(membersRef);
    return snap.docs.map((d) => d.data() as ProjectMember);
  } catch (error) {
    console.error("Error fetching project members:", error);
    return [];
  }
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const memberRef = doc(db, "projects", projectId, "members", userId);
  await deleteDoc(memberRef);
}
