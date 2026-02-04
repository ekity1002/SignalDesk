import { redirect, Form, Link } from "react-router";
import type { Route } from "./+types/logout";
import { getSession, destroySession } from "~/lib/auth/session.server";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export function meta() {
  return [{ title: "Logout - SignalDesk" }];
}

export default function Logout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
          Sign out
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Are you sure you want to sign out?
        </p>

        <div className="flex gap-4">
          <Link
            to="/"
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
          <Form method="post" className="flex-1">
            <button
              type="submit"
              className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Sign out
            </button>
          </Form>
        </div>
      </div>
    </main>
  );
}
