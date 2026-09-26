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

export async function GET() {
  try {
    const items = await prisma.libraryItem.findMany({
      orderBy: { savedAt: "desc" },
    });

    const parsed = items.map((item) => ({
      ...item,
      data: safeParseJson(item.data, {}),
      tags: safeParseJson(item.tags, []),
      savedAt: item.savedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items: parsed });
  } catch (error: any) {
    console.error("GET /api/library error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch library" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, name, data, source, tags } = body;

    if (!type || !name) {
      return NextResponse.json(
        { success: false, error: "Type and name are required" },
        { status: 400 }
      );
    }

    const item = await prisma.libraryItem.create({
      data: {
        type,
        name,
        data: JSON.stringify(data || {}),
        source: source || "Opalite",
        tags: JSON.stringify(tags || []),
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        data: data || {},
        tags: tags || [],
        savedAt: item.savedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("POST /api/library error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save to library" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    await prisma.libraryItem.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Item deleted" });
  } catch (error: any) {
    console.error("DELETE /api/library error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete item" },
      { status: 500 }
    );
  }
}
