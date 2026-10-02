import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getBoardData } from "@/lib/server/board";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const querySchema = z.object({ start: dateSchema, end: dateSchema });

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    start: request.nextUrl.searchParams.get("start"),
    end: request.nextUrl.searchParams.get("end"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "start and end query params must be YYYY-MM-DD" }, { status: 400 });
  }
  if (parsed.data.end < parsed.data.start) {
    return NextResponse.json({ error: "end must be on or after start" }, { status: 400 });
  }

  const data = await getBoardData(parsed.data.start, parsed.data.end);
  return NextResponse.json(data);
}
