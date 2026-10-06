import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";

export type ClientStatus = "lead" | "active" | "inactive";

export interface FirestoreClient {
  id: string;
  ownerId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: ClientStatus;
  notes?: string;
  projectsCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface CreateClientDTO {
  ownerId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status?: ClientStatus;
  notes?: string;
}

export async function getClients(ownerId: string): Promise<FirestoreClient[]> {
  try {
    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, where("ownerId", "==", ownerId), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as FirestoreClient[];
  } catch (error) {
    console.error("Error fetching clients from Firestore:", error);
    return [];
  }
}

export async function getClientById(clientId: string): Promise<FirestoreClient | null> {
  try {
    const clientRef = doc(db, "clients", clientId);
    const snap = await getDoc(clientRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FirestoreClient;
  } catch (error) {
    console.error("Error fetching client by id:", error);
    return null;
  }
}

export async function createClient(dto: CreateClientDTO): Promise<FirestoreClient> {
  const clientsRef = collection(db, "clients");
  const newDocRef = doc(clientsRef);

  const clientData: FirestoreClient = {
    id: newDocRef.id,
    ownerId: dto.ownerId,
    name: dto.name.trim(),
    company: dto.company || dto.name.trim(),
    email: dto.email || "",
    phone: dto.phone || "",
    status: dto.status || "active",
    notes: dto.notes || "",
    projectsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(newDocRef, clientData);
  return clientData;
}

export async function updateClient(
  clientId: string,
  patch: Partial<Omit<FirestoreClient, "id" | "ownerId">>
): Promise<void> {
  const clientRef = doc(db, "clients", clientId);
  await updateDoc(clientRef, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClient(clientId: string): Promise<void> {
  const clientRef = doc(db, "clients", clientId);
  await deleteDoc(clientRef);
}
