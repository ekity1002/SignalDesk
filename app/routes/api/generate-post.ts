import { data } from "react-router";
import { getSession } from "~/lib/auth/session.server";
import { generatePost } from "~/lib/llm/generate-post.server";
import { generatePostInputSchema } from "~/lib/llm/schemas";
import type { Route } from "./+types/generate-post";

async function requireAuth(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const isAuthenticated = session.get("isAuthenticated");
  if (!isAuthenticated) {
    throw data({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);

  if (request.method !== "POST") {
    throw data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const result = generatePostInputSchema.safeParse(body);

    if (!result.success) {
      throw data({ error: "Invalid input", details: result.error.flatten() }, { status: 400 });
    }

    const generatedPost = await generatePost(result.data);
    return { post: generatedPost };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    throw data(
      { error: error instanceof Error ? error.message : "Failed to generate post" },
      { status: 500 },
    );
  }
}
