import { data } from "react-router";
import { getSession } from "~/lib/auth/session.server";
import {
  createSource,
  deleteSource,
  getSources,
  toggleSourceActive,
} from "~/lib/rss/sources.server";
import type { Route } from "./+types/sources";

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
    const sources = await getSources();
    return { sources };
  } catch (error) {
    throw data(
      { error: error instanceof Error ? error.message : "Failed to fetch sources" },
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
    const url = formData.get("url");

    if (typeof name !== "string" || typeof url !== "string") {
      throw data({ error: "Invalid input" }, { status: 400 });
    }

    try {
      const source = await createSource({ name, url });
      return { source };
    } catch (error) {
      throw data(
        { error: error instanceof Error ? error.message : "Failed to create source" },
        { status: 400 },
      );
    }
  }

  if (method === "DELETE") {
    const formData = await request.formData();
    const id = formData.get("id");

    if (typeof id !== "string") {
      throw data({ error: "Invalid input" }, { status: 400 });
    }

    try {
      await deleteSource(id);
      return { success: true };
    } catch (error) {
      throw data(
        { error: error instanceof Error ? error.message : "Failed to delete source" },
        { status: 400 },
      );
    }
  }

  if (method === "PATCH") {
    const formData = await request.formData();
    const id = formData.get("id");
    const isActive = formData.get("isActive") === "true";

    if (typeof id !== "string") {
      throw data({ error: "Invalid input" }, { status: 400 });
    }

    try {
      const source = await toggleSourceActive(id, isActive);
      return { source };
    } catch (error) {
      throw data(
        { error: error instanceof Error ? error.message : "Failed to update source" },
        { status: 400 },
      );
    }
  }

  throw data({ error: "Method not allowed" }, { status: 405 });
}
