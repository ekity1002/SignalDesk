import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Power, Rss, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  Form as RouterForm,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { getSession } from "~/lib/auth/session.server";
import { type CreateSourceFormData, createSourceSchema } from "~/lib/rss/schemas";
import {
  createSource,
  deleteSource,
  getSources,
  toggleSourceActive,
} from "~/lib/rss/sources.server";
import type { Route } from "./+types/sources";

export function meta(_args: Route.MetaArgs) {
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
    const rawData = {
      name: formData.get("name"),
      url: formData.get("url"),
    };

    const result = createSourceSchema.safeParse(rawData);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0].message,
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    try {
      await createSource(result.data);
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

  if (intent === "toggle") {
    const id = formData.get("id");
    const isActive = formData.get("isActive") === "true";
    if (typeof id !== "string") {
      return { success: false, error: "Invalid ID" };
    }

    try {
      await toggleSourceActive(id, !isActive);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle source",
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
  const submit = useSubmit();

  const form = useForm<CreateSourceFormData>({
    resolver: zodResolver(createSourceSchema),
    defaultValues: {
      name: "",
      url: "",
    },
  });

  // Reset form after successful submission
  useEffect(() => {
    if (navigation.state === "idle" && actionData?.success) {
      form.reset();
    }
  }, [navigation.state, actionData, form]);

  const onSubmit = (data: CreateSourceFormData) => {
    submit({ ...data, intent: "create" }, { method: "post" });
  };

  return (
    <div className="w-full overflow-hidden p-8">
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
          <Form {...form}>
            <form
              method="post"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-end gap-4"
            >
              <input type="hidden" name="intent" value="create" />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-muted-foreground">Source Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Tech News" className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex-[2]">
                    <FormLabel className="text-muted-foreground">RSS URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/feed"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isSubmitting || sources.length >= 10}
                className="bg-sidebar-accent hover:bg-sidebar-accent/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </form>
          </Form>
          {actionData?.error && !actionData?.success && (
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
                className="flex items-center justify-between overflow-hidden border-sidebar-border bg-card p-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Badge
                    variant={source.is_active ? "default" : "secondary"}
                    className={
                      source.is_active
                        ? "bg-green-600 text-white hover:bg-green-600"
                        : "bg-gray-400 text-white hover:bg-gray-400"
                    }
                  >
                    {source.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{source.name}</h3>
                    <p className="break-all text-sm text-muted-foreground">{source.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <RouterForm method="post">
                    <input type="hidden" name="intent" value="toggle" />
                    <input type="hidden" name="id" value={source.id} />
                    <input type="hidden" name="isActive" value={String(source.is_active)} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      disabled={isSubmitting}
                      className={
                        source.is_active
                          ? "text-green-600 hover:bg-green-600/10 hover:text-green-600"
                          : "text-muted-foreground hover:text-foreground"
                      }
                      title={source.is_active ? "Disable source" : "Enable source"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </RouterForm>
                  <RouterForm method="post">
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
                  </RouterForm>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
