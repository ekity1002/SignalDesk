import { ArrowLeft, Plus, Rss, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { getSession } from "~/lib/auth/session.server";
import { createSource, deleteSource, getSources } from "~/lib/rss/sources.server";
import type { Route } from "./+types/sources";

export function meta({}: Route.MetaArgs) {
  return [{ title: "RSS Sources - SignalDesk" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("isAuthenticated")) {
    throw redirect("/login");
  }

  const sources = await getSources();
  return { sources };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("isAuthenticated")) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name");
    const url = formData.get("url");

    if (typeof name !== "string" || typeof url !== "string" || !name || !url) {
      return { success: false, error: "Name and URL are required" };
    }

    try {
      await createSource({ name, url });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create source",
      };
    }
  }

  if (intent === "delete") {
    const id = formData.get("id");
    if (typeof id !== "string") {
      return { success: false, error: "Invalid ID" };
    }

    try {
      await deleteSource(id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete source",
      };
    }
  }

  return { success: true };
}

export default function SourcesPage() {
  const { sources } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form after successful submission
  useEffect(() => {
    if (navigation.state === "idle" && actionData?.success) {
      formRef.current?.reset();
    }
  }, [navigation.state, actionData]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Rss className="h-5 w-5 text-sidebar-accent" />
          <h1 className="text-xl font-semibold">RSS Sources Management</h1>
        </div>
      </div>

      {/* Add New Source */}
      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium tracking-wider text-muted-foreground">
          ADD NEW SOURCE
        </h2>
        <Card className="border-sidebar-border bg-card p-4">
          <Form ref={formRef} method="post" className="flex items-end gap-4">
            <input type="hidden" name="intent" value="create" />
            <div className="flex-1">
              <label htmlFor="name" className="mb-2 block text-sm text-muted-foreground">
                Source Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Tech News"
                required
                className="bg-background"
              />
            </div>
            <div className="flex-[2]">
              <label htmlFor="url" className="mb-2 block text-sm text-muted-foreground">
                RSS URL
              </label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com/feed"
                required
                className="bg-background"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || sources.length >= 10}
              className="bg-sidebar-accent hover:bg-sidebar-accent/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </Form>
          {actionData?.error && (
            <p className="mt-2 text-sm text-destructive">{actionData.error}</p>
          )}
          {sources.length >= 10 && (
            <p className="mt-2 text-sm text-destructive">Maximum sources limit (10) reached</p>
          )}
        </Card>
      </section>

      {/* Registered Sources */}
      <section>
        <h2 className="mb-4 text-sm font-medium tracking-wider text-muted-foreground">
          REGISTERED SOURCES
        </h2>
        <div className="space-y-3">
          {sources.length === 0 ? (
            <Card className="border-sidebar-border bg-card p-6 text-center text-muted-foreground">
              No sources registered yet. Add your first RSS source above.
            </Card>
          ) : (
            sources.map((source) => (
              <Card
                key={source.id}
                className="flex items-center justify-between border-sidebar-border bg-card p-4"
              >
                <div>
                  <h3 className="font-medium">{source.name}</h3>
                  <p className="text-sm text-muted-foreground">{source.url}</p>
                </div>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={source.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    disabled={isSubmitting}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Form>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
