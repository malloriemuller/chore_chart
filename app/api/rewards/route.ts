import { NextResponse } from "next/server";
import { getRewardsData } from "@/lib/server/rewards";

export async function GET() {
  const data = await getRewardsData();
  return NextResponse.json(data);
}
