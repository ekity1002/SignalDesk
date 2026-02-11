import { createUnauthorizedResponse, verifyCronAuth } from "~/lib/cron/auth.server";
import { deleteOldArticles } from "~/lib/rss/articles.server";
import { getSettings } from "~/lib/settings/settings.server";

export async function loader({ request }: { request: Request }) {
  if (!verifyCronAuth(request)) {
    return createUnauthorizedResponse();
  }

  try {
    console.log("[CRON] Starting old articles cleanup");

    const settings = await getSettings();
    const { deletedCount } = await deleteOldArticles(settings.article_retention_days);

    console.log(
      `[CRON] Cleanup completed: ${deletedCount} articles deleted (retention: ${settings.article_retention_days} days)`,
    );

    return Response.json({
      success: true,
      deletedCount,
      retentionDays: settings.article_retention_days,
    });
  } catch (error) {
    console.error("[CRON] Cleanup error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
