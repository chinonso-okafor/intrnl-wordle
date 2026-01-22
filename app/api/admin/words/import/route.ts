import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAdminAction, AdminActions } from "@/lib/admin-logger";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "answer" or "validation"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    
    if (lines.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let errors: string[] = [];

    if (type === "answer") {
      // Parse CSV: word,source
      const header = lines[0].toLowerCase();
      const hasSource = header.includes("source");
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          // Parse CSV line (handle quoted values)
          const match = line.match(/^"([^"]+)",?"([^"]*)"?$/);
          if (!match) {
            errors.push(`Line ${i + 1}: Invalid format`);
            skipped++;
            continue;
          }

          const word = match[1].toUpperCase().trim();
          const source = (match[2] || "supplemental").toLowerCase().trim();

          if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
            errors.push(`Line ${i + 1}: Invalid word "${word}"`);
            skipped++;
            continue;
          }

          if (source !== "nyt" && source !== "supplemental") {
            errors.push(`Line ${i + 1}: Invalid source "${source}"`);
            skipped++;
            continue;
          }

          try {
            await prisma.answerWord.upsert({
              where: { word },
              update: { source },
              create: { word, source },
            });
            imported++;
          } catch (error: any) {
            if (error.code === "P2002") {
              skipped++;
            } else {
              errors.push(`Line ${i + 1}: ${error.message}`);
              skipped++;
            }
          }
        } catch (error: any) {
          errors.push(`Line ${i + 1}: ${error.message}`);
          skipped++;
        }
      }
    } else {
      // Parse CSV: word
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase() === "word") continue; // Skip header

        try {
          // Remove quotes if present
          const word = line.replace(/^"|"$/g, "").toUpperCase().trim();

          if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
            errors.push(`Line ${i + 1}: Invalid word "${word}"`);
            skipped++;
            continue;
          }

          try {
            await prisma.validationWord.upsert({
              where: { word },
              update: {},
              create: { word },
            });
            imported++;
          } catch (error: any) {
            if (error.code === "P2002") {
              skipped++;
            } else {
              errors.push(`Line ${i + 1}: ${error.message}`);
              skipped++;
            }
          }
        } catch (error: any) {
          errors.push(`Line ${i + 1}: ${error.message}`);
          skipped++;
        }
      }
    }

    // Log admin action
    await logAdminAction(session.user.id as string, AdminActions.IMPORT_WORDS, {
      type,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Limit error details
    });

    // Refresh in-memory Sets
    const { refreshAnswerWordsSet } = await import("@/lib/answer-words");
    const { refreshValidationWordsSet } = await import("@/lib/validation-words");
    refreshAnswerWordsSet();
    refreshValidationWordsSet();

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 20), // Return first 20 errors
    });
  } catch (error) {
    console.error("Error importing words:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
