import { NextResponse } from "next/server"

// Any /api/* path that doesn't match a real route lands here. Always answer
// with JSON so API clients can rely on response.json() even on 404.
function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export const GET = notFound
export const POST = notFound
export const PUT = notFound
export const PATCH = notFound
export const DELETE = notFound
export const HEAD = notFound
