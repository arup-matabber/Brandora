import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to safely parse JSON strings
function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: { client: true },
      orderBy: { updatedAt: "desc" },
    });

    const parsed = projects.map((p) => ({
      ...p,
      client: p.client?.name || p.clientName,
      canvasObjects: safeParseJson(p.canvasObjects, []),
      brandBrain: safeParseJson(p.brandBrain, null),
      visualPreview: safeParseJson(p.visualPreview, null) || {
        monogram: (p.name || "OP").slice(0, 2).toUpperCase(),
        fontSpecimen: "Satoshi",
        secondaryFont: "Inter",
        palette: ["#191918", "#EBEBE7", "#F7F7F5"],
        gridAccent: "#191918",
      },
      materials: safeParseJson(p.materials, []),
    }));

    return NextResponse.json({ success: true, projects: parsed });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, client: clientNameInput, type, description, notes, materials, brandBrain } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      );
    }

    const clientName = clientNameInput?.trim() || "Independent";

    // 1. Ensure Client exists
    let clientRecord = await prisma.client.findUnique({
      where: { name: clientName },
    });

    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          name: clientName,
          company: clientName,
          status: "Active",
          projectsCount: 1,
        },
      });
    } else {
      await prisma.client.update({
        where: { id: clientRecord.id },
        data: { projectsCount: { increment: 1 } },
      });
    }

    // 2. Generate unique slug / id
    const baseSlug =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `proj-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.project.findUnique({ where: { id: slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // 3. Initial Canvas with Brand Brain item
    const initialCanvasObjects = [
      {
        id: `bb-${Date.now()}`,
        type: "brand_brain",
        x: 80,
        y: 60,
        width: 320,
        height: 380,
        zIndex: 1,
        content: {
          title: name,
          client: clientName,
          type: type || "Brand Identity",
          brain: brandBrain,
        },
      },
    ];

    const project = await prisma.project.create({
      data: {
        id: slug,
        name,
        clientId: clientRecord.id,
        clientName,
        type: type || "Brand Identity",
        status: "In Progress",
        notes: notes || description || null,
        canvasObjects: JSON.stringify(initialCanvasObjects),
        brandBrain: brandBrain ? JSON.stringify(brandBrain) : null,
        materials: materials ? JSON.stringify(materials) : "[]",
      },
    });

    // 4. Log Activity
    await prisma.activity.create({
      data: {
        projectId: project.id,
        projectName: project.name,
        type: "created",
        title: `Created project ${name}`,
        description: `Brand identity project initialized for ${clientName}`,
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        client: clientName,
        canvasObjects: initialCanvasObjects,
        brandBrain: brandBrain || null,
        materials: materials || [],
      },
    });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
