/**
 * Cron API認証ユーティリティ
 *
 * 以下の2つの認証方式をサポート:
 * 1. Authorization: Bearer ${CRON_SECRET} - ローカル開発・外部サービスからの呼び出し
 * 2. x-vercel-cron-auth-token - Vercel Cronからの呼び出し
 */
export function verifyCronAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON] CRON_SECRET environment variable is not set");
    return false;
  }

  // 1. Authorization header (ローカル・外部サービス用)
  const authHeader = request.headers.get("Authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // 2. Vercel Cron header
  const vercelCronHeader = request.headers.get("x-vercel-cron-auth-token");
  if (vercelCronHeader === cronSecret) {
    return true;
  }

  return false;
}

export function createUnauthorizedResponse(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
