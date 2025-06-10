import { NextResponse } from "next/server";
import { initCron } from "../../lib/cron" ;

// Ensure cron jobs are initialized on every server start
initCron();

export function middleware(request: Request) {
  return NextResponse.next();
}
