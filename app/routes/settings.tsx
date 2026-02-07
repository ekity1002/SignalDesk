import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { getSession } from "~/lib/auth/session.server";
import { type Settings, settingsFormSchema, settingsSchema } from "~/lib/settings/schemas";
import { getSettings, updateSettings } from "~/lib/settings/settings.server";
import type { Route } from "./+types/settings";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Settings - SignalDesk" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("isAuthenticated")) {
    throw redirect("/login");
  }

  const settings = await getSettings();
  return { settings };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("isAuthenticated")) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const rawData = {
    article_retention_days: formData.get("article_retention_days"),
  };

  const result = settingsFormSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0].message,
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await updateSettings(result.data.article_retention_days);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }

  return { success: true };
}

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submit = useSubmit();

  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      article_retention_days: settings.article_retention_days,
    },
  });

  useEffect(() => {
    if (navigation.state === "idle" && actionData?.success) {
      form.reset({ article_retention_days: form.getValues("article_retention_days") });
    }
  }, [navigation.state, actionData, form]);

  const onSubmit = (data: Settings) => {
    submit({ article_retention_days: String(data.article_retention_days) }, { method: "post" });
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
          <SettingsIcon className="h-5 w-5 text-sidebar-accent" />
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </div>

      {/* Article Retention Settings */}
      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium tracking-wider text-muted-foreground">
          ARTICLE RETENTION
        </h2>
        <Card className="border-sidebar-border bg-card p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="article_retention_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retention Period (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        className="max-w-xs bg-background"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "" : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Articles older than this will be automatically deleted. Favorites are always
                      kept. (1-365 days)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sidebar-accent hover:bg-sidebar-accent/90"
                >
                  Save Settings
                </Button>
                {actionData?.success && navigation.state === "idle" && (
                  <span className="text-sm text-green-600">Settings saved successfully</span>
                )}
              </div>
            </form>
          </Form>
          {actionData?.error && !actionData?.success && (
            <p className="mt-4 text-sm text-destructive">{actionData.error}</p>
          )}
        </Card>
      </section>
    </div>
  );
}
