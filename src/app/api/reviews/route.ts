import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, directionId, name, description, notes, canvasItems } = body;

    if (!projectId || !directionId) {
      return NextResponse.json(
        { success: false, error: "projectId and directionId are required" },
        { status: 400 }
      );
    }

    // 0. Ensure project exists in Prisma so DirectionVersion foreign key doesn't fail
    await prisma.project.upsert({
      where: { id: projectId },
      update: {},
      create: {
        id: projectId,
        name: body.projectName || projectId,
        clientName: body.clientName || "Client",
        type: "Brand Identity",
      },
    }).catch(() => null);

    // 1. Calculate next version number
    const count = await prisma.directionVersion.count({
      where: { projectId, directionId },
    });
    const versionNumber = count + 1;

    // 2. Create direction version
    const version = await prisma.directionVersion.create({
      data: {
        projectId,
        directionId,
        versionNumber,
        name: name || `Direction ${String(versionNumber).padStart(2, "0")}`,
        description: description || null,
        notes: notes || null,
        canvasItems: JSON.stringify(canvasItems || []),
      },
    });

    // 3. Upsert unique secret share token (using client token if provided)
    const token = body.token || `rev_${crypto.randomBytes(8).toString("hex")}`;
    const share = await prisma.reviewShare.upsert({
      where: { token },
      update: {
        projectId,
        directionId,
        accessLevel: body.accessLevel || "COMMENT",
        active: true,
      },
      create: {
        token,
        projectId,
        directionId,
        accessLevel: body.accessLevel || "COMMENT",
        active: true,
      },
    });

    // 4. Create review record with PUBLISHED status
    const review = await prisma.clientReview.create({
      data: {
        directionId,
        versionId: version.id,
        clientToken: token,
        status: "PUBLISHED",
      },
    });

    // 5. Log activity
    await prisma.activity.create({
      data: {
        projectId,
        type: "published",
        title: `Published ${version.name}`,
        description: `Version ${versionNumber} published for client review`,
      },
    });

    return NextResponse.json({
      success: true,
      version: {
        ...version,
        canvasItems: canvasItems || [],
      },
      share,
      review,
    });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to publish direction" },
      { status: 500 }
    );
  }
}
