import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasAccess = request.cookies.get("files_access")?.value === process.env.NEXT_PUBLIC_KEY;

  if (!hasAccess) {
    return NextResponse.redirect(new URL("/protect", request.url));
  }
}

export const config = {
  matcher: "/file/:path*",
};
