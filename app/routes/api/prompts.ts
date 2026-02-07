import { data } from "react-router";
import { getSession } from "~/lib/auth/session.server";
import { createPrompt, deletePrompt, getPrompts, updatePrompt } from "~/lib/prompts/prompts.server";
import { createPromptSchema, updatePromptSchema } from "~/lib/prompts/schemas";
import type { Route } from "./+types/prompts";

async function requireAuth(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const isAuthenticated = session.get("isAuthenticated");
  if (!isAuthenticated) {
    throw data({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  try {
    const prompts = await getPrompts();
    return { prompts };
  } catch (error) {
    throw data(
      { error: error instanceof Error ? error.message : "Failed to fetch prompts" },
      { status: 500 },
    );
  }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);

  const method = request.method;

  if (method === "POST") {
    const formData = await request.formData();
    const name = formData.get("name");
    const template = formData.get("template");
    const isDefault = formData.get("is_default") === "true";

    const result = createPromptSchema.safeParse({
      name,
      template,
      is_default: isDefault,
    });

    if (!result.success) {
      throw data({ error: "Invalid input", details: result.error.flatten() }, { status: 400 });
    }

    try {
      const prompt = await createPrompt(result.data);
      return { prompt };
    } catch (error) {
      throw data(
        { error: error instanceof Error ? error.message : "Failed to create prompt" },
        { status: 400 },
      );
    }
  }

  if (method === "PUT") {
    const formData = await request.formData();
    const id = formData.get("id");
    const name = formData.get("name");
    const template = formData.get("template");
    const isDefault = formData.get("is_default");

    if (typeof id !== "string") {
      throw data({ error: "Invalid input: id is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (template) updateData.template = template;
    if (isDefault !== null) updateData.is_default = isDefault === "true";

    const result = updatePromptSchema.safeParse(updateData);

    if (!result.success) {
      throw data({ error: "Invalid input", details: result.error.flatten() }, { status: 400 });
    }

    try {
      const prompt = await updatePrompt(id, result.data);
      return { prompt };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update prompt";
      const status = message === "Prompt not found" ? 404 : 400;
      throw data({ error: message }, { status });
    }
  }

  if (method === "DELETE") {
    const formData = await request.formData();
    const id = formData.get("id");

    if (typeof id !== "string") {
      throw data({ error: "Invalid input" }, { status: 400 });
    }

    try {
      await deletePrompt(id);
      return { success: true };
    } catch (error) {
      throw data(
        { error: error instanceof Error ? error.message : "Failed to delete prompt" },
        { status: 400 },
      );
    }
  }

  throw data({ error: "Method not allowed" }, { status: 405 });
}
