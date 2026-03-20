import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "status.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const status = JSON.parse(fileContent);
    return NextResponse.json(status);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}
