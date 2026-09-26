import { NextRequest, NextResponse } from "next/server";
import { GoogleFontsProvider } from "@/lib/typography/google-provider";
import { FontSortOption } from "@/lib/typography/types";

// Singleton server provider instance with in-memory caching
const googleProvider = new GoogleFontsProvider(process.env.GOOGLE_FONTS_API_KEY);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const sort = (searchParams.get("sort") as FontSortOption) || "popularity";
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const result = await googleProvider.getFonts({
      sort,
      category,
      search,
      limit,
      offset,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("[Opalite /api/fonts Error]:", error);

    return NextResponse.json(
      {
        fonts: [],
        total: 0,
        hasMore: false,
        provider: "google",
        error: error.message || "Failed to load fonts",
        isFallback: true,
      },
      { status: 500 }
    );
  }
}
