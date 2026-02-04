import { redirect, Form, Link } from "react-router";
import type { Route } from "./+types/logout";
import { getSession, destroySession } from "~/lib/auth/session.server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

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
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/">Cancel</Link>
            </Button>
            <Form method="post" className="flex-1">
              <Button type="submit" variant="destructive" className="w-full">
                Sign out
              </Button>
            </Form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
