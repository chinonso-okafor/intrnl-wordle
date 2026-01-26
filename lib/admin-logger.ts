import { prisma } from "./db";

export async function logAdminAction(
  adminId: string,
  action: string,
  details: Record<string, any>
) {
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminId,
        action,
        details: JSON.stringify(details),
      },
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
    // Don't throw - logging failures shouldn't break the app
  }
}

export const AdminActions = {
  SET_WORD: "set_word",
  DELETE_WORD: "delete_word",
  UPDATE_SETTINGS: "update_settings",
  APPROVE_REPORT: "approve_report",
  REJECT_REPORT: "reject_report",
  REMOVE_WORD: "remove_word",
  IMPORT_WORDS: "import_words",
  EXPORT_WORDS: "export_words",
} as const;
