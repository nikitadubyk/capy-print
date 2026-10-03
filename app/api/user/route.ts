import { NextResponse } from "next/server";
import { requireRole, sessionHeaders, sessionUserDto } from "@/lib";

export async function GET(request: Request) {
  const result = await requireRole(request, "USER");
  if (result instanceof NextResponse) return result;
  return NextResponse.json(
    { user: sessionUserDto(result.user) },
    { headers: sessionHeaders }
  );
}

// Registration/profile updates happen only during verified session creation.
export async function POST() {
  return NextResponse.json(
    { error: "Используйте вход через Mini App" },
    { status: 405, headers: { ...sessionHeaders, Allow: "GET" } }
  );
}
