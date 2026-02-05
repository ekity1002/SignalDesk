import { fetchAllRssSources } from "~/lib/rss/fetch-rss.server";

export async function loader({ request }: { request: Request }) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Starting RSS fetch batch");
    const result = await fetchAllRssSources();

    const totalCreated = result.results.reduce((sum, r) => sum + r.created, 0);
    const totalSkipped = result.results.reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = result.results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(
      `[CRON] Completed: ${result.totalSources} sources, ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} errors`,
    );

    for (const r of result.results) {
      if (r.errors.length > 0) {
        console.error(`[CRON] Errors for ${r.sourceName}:`, r.errors);
      }
    }

    return Response.json({
      success: true,
      totalSources: result.totalSources,
      results: result.results,
    });
  } catch (error) {
    console.error("[CRON] Fatal error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
