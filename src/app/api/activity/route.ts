import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const activity = await prisma.activity.findMany({
      take: 50,
      orderBy: { timestamp: "desc" },
    });

    const formatted = activity.map((a) => ({
      ...a,
      timestamp: a.timestamp.toISOString(),
    }));

    return NextResponse.json({ success: true, activity: formatted });
  } catch (error: any) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
