import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ status: "error", message: "No file uploaded" });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();

  // IMAGE HANDLING ✅
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) {
    const base64 = buffer.toString("base64");
    const mime = file.type;

    return NextResponse.json({
      status: "image",
      name: file.name,
      base64: `data:${mime};base64,${base64}`
    });
  }

  // TEXT FILE HANDLING ✅
  const content = buffer.toString("utf-8");

  return NextResponse.json({
    status: "text",
    name: file.name,
    content
  });
}
