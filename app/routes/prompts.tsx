import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Form, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { getSession } from "~/lib/auth/session.server";
import { createPrompt, deletePrompt, getPrompts, updatePrompt } from "~/lib/prompts/prompts.server";
import { createPromptSchema, updatePromptSchema } from "~/lib/prompts/schemas";
import type { Route } from "./+types/prompts";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Prompts - SignalDesk" },
    { name: "description", content: "Manage your prompt templates" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("isAuthenticated")) {
    throw redirect("/login");
  }

  const prompts = await getPrompts();
  return { prompts };
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
    const template = formData.get("template");
    const isDefault = formData.get("is_default") === "on";

    const result = createPromptSchema.safeParse({
      name,
      template,
      is_default: isDefault,
    });

    if (!result.success) {
      return { success: false, error: "Invalid input", details: result.error.flatten() };
    }

    try {
      await createPrompt(result.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create prompt",
      };
    }
  }

  if (intent === "update") {
    const id = formData.get("id");
    const name = formData.get("name");
    const template = formData.get("template");
    const isDefault = formData.get("is_default") === "on";

    if (typeof id !== "string") {
      return { success: false, error: "Invalid prompt ID" };
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (template) updateData.template = template;
    updateData.is_default = isDefault;

    const result = updatePromptSchema.safeParse(updateData);

    if (!result.success) {
      return { success: false, error: "Invalid input", details: result.error.flatten() };
    }

    try {
      await updatePrompt(id, result.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update prompt",
      };
    }
  }

  if (intent === "delete") {
    const id = formData.get("id");

    if (typeof id !== "string") {
      return { success: false, error: "Invalid prompt ID" };
    }

    try {
      await deletePrompt(id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete prompt",
      };
    }
  }

  return { success: false, error: "Invalid action" };
}

type Prompt = {
  id: string;
  name: string;
  template: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

function PromptFormDialog({
  open,
  onOpenChange,
  prompt,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: Prompt;
  isSubmitting: boolean;
}) {
  const isEdit = !!prompt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <Form method="post" onSubmit={() => onOpenChange(false)}>
          <input type="hidden" name="intent" value={isEdit ? "update" : "create"} />
          {isEdit && <input type="hidden" name="id" value={prompt.id} />}
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Prompt" : "Create Prompt"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update your prompt template"
                : "Create a new prompt template for generating Slack posts"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Tech News Summary"
                defaultValue={prompt?.name ?? ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template">Template</Label>
              <Textarea
                id="template"
                name="template"
                placeholder="Write a brief summary of: {{title}}&#10;&#10;Available variables: {{title}}, {{description}}, {{link}}, {{publishedAt}}, {{matchedTags}}"
                defaultValue={prompt?.template ?? ""}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {"{{title}}"}, {"{{description}}"}, {"{{link}}"},{" "}
                {"{{publishedAt}}"}, {"{{matchedTags}}"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                name="is_default"
                defaultChecked={prompt?.is_default ?? false}
              />
              <Label htmlFor="is_default" className="text-sm font-normal">
                Set as default prompt
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Prompts() {
  const { prompts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-purple-500" />
          <h1 className="text-xl font-semibold">Prompt Templates</h1>
          <Badge variant="secondary" className="min-w-[80px] justify-center">
            {prompts.length} items
          </Badge>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      {/* Error display */}
      {actionData && !actionData.success && "error" in actionData && (
        <p className="mb-4 text-sm text-destructive">{actionData.error}</p>
      )}

      {/* Prompt list */}
      <div className="space-y-3">
        {prompts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>No prompt templates yet. Create one to get started.</p>
          </div>
        ) : (
          prompts.map((prompt) => (
            <Card key={prompt.id} className="border-sidebar-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-medium">{prompt.name}</h3>
                    {prompt.is_default && (
                      <Badge variant="default" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{prompt.template}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingPrompt(prompt)}
                    title="Edit prompt"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={prompt.id} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isSubmitting}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete prompt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this prompt template? This action cannot
                            be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            type="submit"
                            formAction=""
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </Form>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <PromptFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        isSubmitting={isSubmitting}
      />

      {/* Edit Dialog */}
      <PromptFormDialog
        open={editingPrompt !== null}
        onOpenChange={(open) => !open && setEditingPrompt(null)}
        prompt={editingPrompt ?? undefined}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
