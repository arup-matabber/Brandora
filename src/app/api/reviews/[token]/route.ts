import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveReviewToken } from "@/services/reviews";
import { getReviewComments, addReviewComment } from "@/services/comments";
import { getReviewApprovals, submitApproval as submitFirestoreApproval } from "@/services/approvals";

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
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(req.url);
    const requestedDirectionId = searchParams.get("directionId");

    // 1. Check local Prisma store first
    let share = await prisma.reviewShare.findUnique({
      where: { token },
      include: {
        project: {
          include: { client: true },
        },
      },
    }).catch(() => null);

    if (share && share.active) {
      // Find all published versions for this project
      const allProjectVersions = await prisma.directionVersion.findMany({
        where: { projectId: share.projectId },
        orderBy: { publishedAt: "desc" },
        include: {
          comments: { orderBy: { createdAt: "asc" } },
          approvals: { orderBy: { createdAt: "desc" } },
          reviews: true,
        },
      }).catch(() => []);

      // Find specific requested version or fallback to share.directionId or latest version
      let version = null;
      if (requestedDirectionId) {
        version = allProjectVersions.find((v) => v.directionId === requestedDirectionId) || null;
      }
      if (!version && share.directionId) {
        version = allProjectVersions.find((v) => v.directionId === share.directionId) || null;
      }
      if (!version && allProjectVersions.length > 0) {
        version = allProjectVersions[0];
      }

      if (version) {
        const parsedMembers = safeParseJson(version.canvasItems, []);
        return NextResponse.json({
          success: true,
          share: {
            token: share.token,
            accessLevel: share.accessLevel,
            projectId: share.projectId,
            directionId: share.directionId || version.directionId,
            clientId: share.project?.clientId || share.project?.client?.id || "client",
            active: share.active,
          },
          project: {
            id: share.project?.id || share.projectId,
            name: share.project?.name || "Creative Direction",
            client: share.project?.client?.name || share.project?.clientName || "Client",
            type: share.project?.type || "Brand Identity",
          },
          version: {
            ...version,
            snapshot: {
              name: version.name,
              description: version.description,
              members: parsedMembers,
            },
            canvasItems: parsedMembers,
          },
          versions: allProjectVersions.map((v) => ({
            id: v.id,
            directionId: v.directionId,
            versionNumber: v.versionNumber,
            name: v.name,
            description: v.description,
            status:
              v.approvals[0]?.status?.toUpperCase() === "APPROVED"
                ? "APPROVED"
                : v.approvals[0]?.status?.toUpperCase() === "CHANGES_REQUESTED"
                ? "CHANGES_REQUESTED"
                : "PUBLISHED",
            publishedAt: v.publishedAt instanceof Date ? v.publishedAt.toISOString() : String(v.publishedAt),
            approval: v.approvals[0] ? {
              status: v.approvals[0].status.toUpperCase() === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED",
              clientName: v.approvals[0].clientName,
              createdAt: v.approvals[0].createdAt instanceof Date ? v.approvals[0].createdAt.toISOString() : String(v.approvals[0].createdAt),
            } : null,
            commentCount: v.comments.length,
            canvasItems: safeParseJson(v.canvasItems, []),
          })),
          comments: version.comments.map((c) => ({
            id: c.id,
            projectId: share.projectId,
            directionId: c.directionId,
            versionId: c.versionId,
            authorId: c.authorType,
            authorName: c.author,
            body: c.content,
            x: c.positionX,
            y: c.positionY,
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
          })),
          approval: version.approvals[0] ? {
            id: version.approvals[0].id,
            directionId: version.approvals[0].directionId,
            versionId: version.approvals[0].versionId,
            clientId: "client",
            clientName: version.approvals[0].clientName,
            clientEmail: version.approvals[0].clientEmail,
            status: version.approvals[0].status.toUpperCase() === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED",
            comment: version.approvals[0].feedback,
            createdAt: version.approvals[0].createdAt instanceof Date ? version.approvals[0].createdAt.toISOString() : String(version.approvals[0].createdAt),
          } : null,
          review: version.reviews[0] ? {
            id: version.reviews[0].id,
            projectId: share.projectId,
            directionId: share.directionId,
            versionId: version.id,
            status: version.reviews[0].status.toUpperCase().includes("APPROV") ? "APPROVED" : version.reviews[0].status.toUpperCase().includes("REVISION") ? "CHANGES_REQUESTED" : "PUBLISHED",
          } : null,
        });
      }
    }

    // 2. Check Firestore reviewShares fallback (Strict Client Data Boundary)
    const fShare = await resolveReviewToken(token);
    if (!fShare || !fShare.active) {
      return NextResponse.json(
        { success: false, error: "Review link is invalid or has expired." },
        { status: 404 }
      );
    }

    const [fComments, fApprovals] = await Promise.all([
      getReviewComments(fShare.projectId, fShare.reviewId),
      getReviewApprovals(fShare.projectId, fShare.reviewId),
    ]);

    // Client Data Boundary: return ONLY published direction snapshot, never private canvas or brand brain
    return NextResponse.json({
      success: true,
      share: {
        token: fShare.token,
        accessLevel: fShare.accessLevel,
      },
      project: {
        id: fShare.projectId,
        name: fShare.projectName,
        client: fShare.clientName,
        type: "Brand Direction",
      },
      version: {
        id: fShare.versionId,
        versionNumber: 1,
        name: fShare.directionName,
        description: fShare.snapshot.description,
        canvasItems: fShare.snapshot.members,
        status: "PUBLISHED",
      },
      comments: fComments,
      approval: fApprovals[0] || null,
      review: {
        id: fShare.reviewId,
        status: "PUBLISHED",
      },
    });
  } catch (error: any) {
    console.error("GET /api/reviews/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch review" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { action } = body; // "comment" | "approval"

    // Check Prisma or Firestore for active share
    const share = await prisma.reviewShare.findUnique({
      where: { token },
    }).catch(() => null);

    const fShare = !share ? await resolveReviewToken(token) : null;

    if (!share && !fShare) {
      return NextResponse.json(
        { success: false, error: "Review link is inactive or invalid." },
        { status: 403 }
      );
    }

    const projectId = share?.projectId || fShare?.projectId || "";
    const directionId = body.directionId || share?.directionId || fShare?.directionId || "";
    const versionId = body.versionId;
    const reviewId = fShare?.reviewId || `rev-${directionId}`;

    if (action === "comment") {
      const { author, content, positionX, positionY, parentId } = body;

      let dbComment = null;
      if (share) {
        let version = null;
        if (versionId) {
          version = await prisma.directionVersion.findUnique({ where: { id: versionId } }).catch(() => null);
        }
        if (!version) {
          version = await prisma.directionVersion.findFirst({
            where: { projectId, ...(directionId ? { directionId } : {}) },
            orderBy: { versionNumber: "desc" },
          }).catch(() => null);
        }

        if (version) {
          dbComment = await prisma.comment.create({
            data: {
              directionId: directionId || version.directionId,
              versionId: version.id,
              author: author || "Client",
              authorType: "client",
              content: content || body.body || "",
              positionX,
              positionY,
            },
          }).catch(() => null);

          // Log activity for client comment
          await prisma.activity.create({
            data: {
              projectId,
              type: "comment",
              title: `Comment from ${author || "Client"}`,
              description: content || body.body || "",
              user: author || "Client",
            },
          }).catch(() => null);
        }
      }

      // Background sync to Firestore without blocking response
      addReviewComment(projectId, reviewId, {
        reviewId,
        directionId,
        authorId: "client",
        authorName: author || "Client Reviewer",
        parentCommentId: parentId || null,
        body: content || body.body || "",
        x: positionX,
        y: positionY,
      }).catch((err) => console.warn("Firestore comment sync deferred:", err?.message || err));

      return NextResponse.json({ success: true, comment: dbComment || {
        id: `cmt-${Date.now()}`,
        author: author || "Client",
        content: content || body.body || "",
      } });
    }

    if (action === "approval") {
      const { clientName, clientEmail, status, feedback, signature } = body;
      const approvalType = status === "approved" || status === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED";

      let dbApproval = null;
      if (share) {
        let version = null;
        if (versionId) {
          version = await prisma.directionVersion.findUnique({ where: { id: versionId } }).catch(() => null);
        }
        if (!version) {
          version = await prisma.directionVersion.findFirst({
            where: { projectId, ...(directionId ? { directionId } : {}) },
            orderBy: { versionNumber: "desc" },
          }).catch(() => null);
        }

        if (version) {
          dbApproval = await prisma.approval.create({
            data: {
              directionId: directionId || version.directionId,
              versionId: version.id,
              clientName: clientName || "Client Reviewer",
              clientEmail,
              status: approvalType.toLowerCase(),
              feedback,
              signature,
            },
          }).catch(() => null);

          const updatedReviews = await prisma.clientReview.updateMany({
            where: { versionId: version.id },
            data: {
              status: approvalType === "APPROVED" ? "Approved" : "Revisions Requested",
              approvedAt: approvalType === "APPROVED" ? new Date() : null,
              feedback,
            },
          }).catch(() => ({ count: 0 }));

          if (!updatedReviews || updatedReviews.count === 0) {
            await prisma.clientReview.create({
              data: {
                directionId: directionId || version.directionId,
                versionId: version.id,
                clientToken: token,
                status: approvalType === "APPROVED" ? "Approved" : "Revisions Requested",
                approvedAt: approvalType === "APPROVED" ? new Date() : null,
                feedback,
              },
            }).catch(() => null);
          }

          // Also log activity in DB
          await prisma.activity.create({
            data: {
              projectId,
              type: approvalType === "APPROVED" ? "approved" : "revision",
              title: `${approvalType === "APPROVED" ? "Approved" : "Revisions Requested"}: ${version.name}`,
              description: feedback ? `${clientName}: "${feedback}"` : `By ${clientName}`,
              user: clientName || "Client",
            },
          }).catch(() => null);
        }
      }

      // Background sync to Firestore without blocking response
      submitFirestoreApproval({
        reviewId,
        projectId,
        directionId,
        directionVersionId: fShare?.versionId || `ver-${directionId}`,
        approvedBy: clientName || "Client Reviewer",
        approvalType,
        comment: feedback,
      }).catch((err) => console.warn("Firestore approval sync deferred:", err?.message || err));

      return NextResponse.json({ success: true, approval: dbApproval || {
        id: `appr-${Date.now()}`,
        clientName: clientName || "Client Reviewer",
        status: status || "approved",
      } });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/reviews/[token] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process review action" },
      { status: 500 }
    );
  }
}
