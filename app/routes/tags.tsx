import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Pencil, Plus, Sparkles, Tags, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  type CreateTagFormData,
  createTagFormSchema,
  createTagSchema,
  updateTagKeywordsSchema,
} from "~/lib/tags/schemas";
import { createTag, deleteTag, getTags, updateTagKeywords } from "~/lib/tags/tags.server";
import type { Route } from "./+types/tags";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Interest Tags - SignalDesk" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("isAuthenticated")) {
    throw redirect("/login");
  }

  const tags = await getTags();
  return { tags };
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
      keywords: formData.get("keywords"),
    };

    const result = createTagSchema.safeParse(rawData);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0].message,
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    try {
      await createTag(result.data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create tag",
      };
    }
  }

  if (intent === "delete") {
    const id = formData.get("id");
    if (typeof id !== "string") {
      return { success: false, error: "Invalid ID" };
    }

    try {
      await deleteTag(id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete tag",
      };
    }
  }

  if (intent === "update-keywords") {
    const rawData = {
      tagId: formData.get("tagId"),
      keywords: formData.get("keywords"),
    };

    const result = updateTagKeywordsSchema.safeParse(rawData);

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0].message,
      };
    }

    try {
      await updateTagKeywords(result.data.tagId, result.data.keywords);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update keywords",
      };
    }
  }

  return { success: true };
}

export default function TagsPage() {
  const { tags } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submit = useSubmit();

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editKeywords, setEditKeywords] = useState("");

  const form = useForm<CreateTagFormData>({
    resolver: zodResolver(createTagFormSchema),
    defaultValues: {
      name: "",
      keywords: "",
    },
  });

  // Reset form after successful submission
  useEffect(() => {
    if (navigation.state === "idle" && actionData?.success) {
      form.reset();
      setEditingTagId(null);
    }
  }, [navigation.state, actionData, form]);

  const onSubmit = (data: CreateTagFormData) => {
    submit({ ...data, intent: "create" }, { method: "post" });
  };

  const startEditing = (tagId: string, currentKeywords: string[]) => {
    setEditingTagId(tagId);
    setEditKeywords(currentKeywords.join(", "));
  };

  const cancelEditing = () => {
    setEditingTagId(null);
    setEditKeywords("");
  };

  const saveKeywords = (tagId: string) => {
    submit({ tagId, keywords: editKeywords, intent: "update-keywords" }, { method: "post" });
  };

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
          <Tags className="h-5 w-5 text-sidebar-accent" />
          <h1 className="text-xl font-semibold">Interest Tags Management</h1>
        </div>
      </div>

      {/* Add New Tag */}
      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium tracking-wider text-muted-foreground">
          ADD NEW TAG
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
                    <FormLabel className="text-muted-foreground">Tag Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AI, Cloud" className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem className="flex-[2]">
                    <FormLabel className="text-muted-foreground">
                      Keywords (comma separated)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. machine learning, deep learning"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                disabled
                className="gap-2"
                title="Coming soon"
              >
                <Sparkles className="h-4 w-4" />
                AI Suggest
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-sidebar-accent hover:bg-sidebar-accent/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </form>
          </Form>
          {actionData?.error && !actionData?.success && (
            <p className="mt-2 text-sm text-destructive">{actionData.error}</p>
          )}
        </Card>
      </section>

      {/* Tag List */}
      <section>
        <h2 className="mb-4 text-sm font-medium tracking-wider text-muted-foreground">
          REGISTERED TAGS
        </h2>
        {tags.length === 0 ? (
          <Card className="border-sidebar-border bg-card p-6 text-center text-muted-foreground">
            No tags registered yet. Add your first interest tag above.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tags.map((tag) => (
              <Card key={tag.id} className="border-sidebar-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 font-medium">{tag.name}</h3>
                    {editingTagId === tag.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editKeywords}
                          onChange={(e) => setEditKeywords(e.target.value)}
                          placeholder="keyword1, keyword2"
                          className="bg-background"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => saveKeywords(tag.id)}
                            className="bg-sidebar-accent hover:bg-sidebar-accent/90"
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {tag.keywords.length > 0 ? (
                          tag.keywords.map((kw) => (
                            <Badge key={kw.id} variant="secondary" className="text-xs">
                              {kw.keyword}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No keywords</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-2 flex gap-1">
                    {editingTagId !== tag.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          startEditing(
                            tag.id,
                            tag.keywords.map((kw) => kw.keyword),
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <RouterForm method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={tag.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        disabled={isSubmitting}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </RouterForm>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
