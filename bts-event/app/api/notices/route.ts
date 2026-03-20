import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "notices.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const notices = JSON.parse(fileContent);
    return NextResponse.json(notices);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load notices" }, { status: 500 });
  }
}
