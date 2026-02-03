import { data, redirect, Form } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/login";
import { getSession, commitSession } from "~/lib/auth/session.server";
import { validatePassword } from "~/lib/auth/auth.server";

const LoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

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
    }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/";

  const result = LoginSchema.safeParse({
    password: formData.get("password"),
  });

  if (!result.success) {
    session.flash("error", result.error.issues[0].message);
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  const isValid = validatePassword(result.data.password);

  if (!isValid) {
    session.flash("error", "Invalid password");
    return redirect("/login", {
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <div>
          <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            SignalDesk
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your password to continue
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Form method="post" className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign in
          </button>
        </Form>
      </div>
    </main>
  );
}
