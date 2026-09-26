import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        versions: { orderBy: { versionNumber: "desc" } },
        shares: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const formatted = {
      ...project,
      client: project.client?.name || project.clientName,
      canvasObjects: safeParseJson(project.canvasObjects, []),
      brandBrain: safeParseJson(project.brandBrain, null),
      visualPreview: safeParseJson(project.visualPreview, null) || {
        monogram: (project.name || "OP").slice(0, 2).toUpperCase(),
        fontSpecimen: "Satoshi",
        secondaryFont: "Inter",
        palette: ["#191918", "#EBEBE7", "#F7F7F5"],
        gridAccent: "#191918",
      },
      materials: safeParseJson(project.materials, []),
      versions: project.versions.map((v) => ({
        ...v,
        canvasItems: safeParseJson(v.canvasItems, []),
      })),
    };

    return NextResponse.json({ success: true, project: formatted });
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project" },
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

    const dataToUpdate: Record<string, any> = {};

    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.progress !== undefined) dataToUpdate.progress = body.progress;
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;
    if (body.type !== undefined) dataToUpdate.type = body.type;

    if (body.canvasObjects !== undefined) {
      dataToUpdate.canvasObjects = JSON.stringify(body.canvasObjects);
    }
    if (body.brandBrain !== undefined) {
      dataToUpdate.brandBrain = JSON.stringify(body.brandBrain);
    }
    if (body.visualPreview !== undefined) {
      dataToUpdate.visualPreview = JSON.stringify(body.visualPreview);
    }
    if (body.materials !== undefined) {
      dataToUpdate.materials = JSON.stringify(body.materials);
    }

    const updated = await prisma.project.update({
      where: { id },
      data: dataToUpdate,
      include: { client: true },
    });

    return NextResponse.json({
      success: true,
      project: {
        ...updated,
        client: updated.client?.name || updated.clientName,
        canvasObjects: safeParseJson(updated.canvasObjects, []),
        brandBrain: safeParseJson(updated.brandBrain, null),
        visualPreview: safeParseJson(updated.visualPreview, null),
        materials: safeParseJson(updated.materials, []),
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update project" },
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
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete project" },
      { status: 500 }
    );
  }
}
