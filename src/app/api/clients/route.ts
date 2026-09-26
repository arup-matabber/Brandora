import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: { id: true, name: true, type: true, status: true, updatedAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = clients.map((c) => ({
      ...c,
      projectsCount: c.projects.length,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, clients: formatted });
  } catch (error: any) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, contact, company, email, phone, status, notes } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Client name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.client.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ success: true, client: existing });
    }

    const newClient = await prisma.client.create({
      data: {
        name: name.trim(),
        contact: contact || name.trim(),
        company: company || name.trim(),
        email,
        phone,
        status: status || "Active",
        notes,
        projectsCount: 0,
      },
    });

    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create client" },
      { status: 500 }
    );
  }
}
