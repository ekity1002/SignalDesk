import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { data, redirect, useSubmit } from "react-router";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { validatePassword } from "~/lib/auth/auth.server";
import { type LoginFormData, loginSchema } from "~/lib/auth/schemas";
import { commitSession, getSession } from "~/lib/auth/session.server";
import type { Route } from "./+types/login";

function getSafeRedirectUrl(redirectTo: string | null): string {
  if (!redirectTo) {
    return "/";
  }
  // Only allow relative paths starting with /
  // Reject absolute URLs, protocol-relative URLs (//), and other schemes
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }
  return "/";
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.get("isAuthenticated")) {
    return redirect("/");
  }

  const error = session.get("error");

  return data(
    { error },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();

  const url = new URL(request.url);
  const redirectToParam = url.searchParams.get("redirectTo");
  const redirectTo = getSafeRedirectUrl(redirectToParam);

  const loginUrl = redirectToParam ? `/login?redirectTo=${encodeURIComponent(redirectToParam)}` : "/login";

  const result = loginSchema.safeParse({
    password: formData.get("password"),
  });

  if (!result.success) {
    session.flash("error", result.error.issues[0].message);
    return redirect(loginUrl, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  const isValid = validatePassword(result.data.password);

  if (!isValid) {
    session.flash("error", "Invalid password");
    return redirect(loginUrl, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  session.set("isAuthenticated", true);
  session.set("authenticatedAt", new Date().toISOString());

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export function meta() {
  return [{ title: "Login - SignalDesk" }];
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const { error } = loaderData;
  const submit = useSubmit();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    submit(data, { method: "post" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">SignalDesk</CardTitle>
          <CardDescription>Enter your password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
