import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client: {
        ...client,
        projectsCount: client.projects.length,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("GET /api/clients/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch client" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name: body.name,
        contact: body.contact,
        company: body.company,
        email: body.email,
        phone: body.phone,
        status: body.status,
        notes: body.notes,
      },
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    console.error("PATCH /api/clients/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Client deleted" });
  } catch (error: any) {
    console.error("DELETE /api/clients/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete client" },
      { status: 500 }
    );
  }
}
