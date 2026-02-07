import { ChevronLeft, ChevronRight, LayoutGrid, RefreshCw, Search } from "lucide-react";
import {
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { ArticleCard } from "~/components/articles/ArticleCard";
import { TagFilter } from "~/components/filters/TagFilter";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getSession } from "~/lib/auth/session.server";
import { getPrompts } from "~/lib/prompts/prompts.server";
import { deleteArticle, getArticles, toggleFavorite } from "~/lib/rss/articles.server";
import { getTags } from "~/lib/tags/tags.server";
import type { Route } from "./+types/home";

const ARTICLES_PER_PAGE = 50;

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "SignalDesk" },
    { name: "description", content: "News aggregator for Slack sharing" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("isAuthenticated")) {
    throw redirect("/login");
  }

  const url = new URL(request.url);
  const parsedPage = Number(url.searchParams.get("page") ?? "1");
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const search = url.searchParams.get("search") ?? undefined;
  const tagIds = url.searchParams.getAll("tags");

  const [articlesResult, tags, prompts] = await Promise.all([
    getArticles({
      page,
      limit: ARTICLES_PER_PAGE,
      status: "visible",
      search,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    }),
    getTags(),
    getPrompts(),
  ]);

  return {
    articles: articlesResult.data,
    total: articlesResult.total,
    page,
    totalPages: Math.ceil(articlesResult.total / ARTICLES_PER_PAGE),
    tags,
    prompts,
    search: search ?? "",
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("isAuthenticated")) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "favorite") {
    const articleId = formData.get("articleId");
    if (typeof articleId !== "string") {
      return { success: false, error: "Invalid article ID" };
    }
    try {
      await toggleFavorite(articleId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle favorite",
      };
    }
  }

  if (intent === "delete") {
    const articleId = formData.get("articleId");
    if (typeof articleId !== "string") {
      return { success: false, error: "Invalid article ID" };
    }
    try {
      await deleteArticle(articleId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete article",
      };
    }
  }

  return { success: true };
}

function buildPaginationUrl(page: number, search: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (search) {
    params.set("search", search);
  }
  for (const tag of searchParams.getAll("tags")) {
    params.append("tags", tag);
  }
  return `?${params.toString()}`;
}

export default function Home() {
  const { articles, total, page, totalPages, tags, prompts, search } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const selectedTagIds = searchParams.getAll("tags");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("search") as string;
    const params = new URLSearchParams();
    if (searchValue) {
      params.set("search", searchValue);
    }
    for (const tag of selectedTagIds) {
      params.append("tags", tag);
    }
    submit(params, { method: "get" });
  };

  const hasFilters = search || selectedTagIds.length > 0;

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-5 w-5 text-sidebar-accent" />
          <h1 className="text-xl font-semibold">Latest News</h1>
          <Badge variant="secondary" className="min-w-[60px] justify-center sm:min-w-[80px]">
            {total} items
          </Badge>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Tag Filter */}
          <TagFilter tags={tags} />

          {/* Search */}
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search articles..."
                defaultValue={search}
                className="w-full bg-background pl-9 sm:w-64"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="shrink-0">
              Search
            </Button>
          </form>

          {/* Refresh */}
          <Link to="/" reloadDocument className="shrink-0">
            <Button variant="outline" size="icon" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Error display */}
      {actionData && !actionData.success && "error" in actionData && (
        <p className="mb-4 text-sm text-destructive">{actionData.error}</p>
      )}

      {/* Article list */}
      <div className="space-y-3">
        {articles.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {hasFilters ? (
              <p>No articles found matching your filters</p>
            ) : (
              <p>No articles yet. Articles will appear here after RSS sources are fetched.</p>
            )}
          </div>
        ) : (
          articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isSubmitting={isSubmitting}
              prompts={prompts}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            to={buildPaginationUrl(page - 1, search, searchParams)}
            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
          >
            <Button variant="outline" size="sm" disabled={page <= 1}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
          </Link>
          <span className="order-first text-sm text-muted-foreground sm:order-none">
            Page {page} of {totalPages}
          </span>
          <Link
            to={buildPaginationUrl(page + 1, search, searchParams)}
            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
          >
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
