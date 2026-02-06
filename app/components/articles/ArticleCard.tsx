import { ExternalLink, RotateCcw, Star, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Form as RouterForm } from "react-router";
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

type ArticleTag = {
  tag_id: string;
  tags: { id: string; name: string } | null;
};

type ArticleCardProps = {
  article: {
    id: string;
    title: string;
    description: string | null;
    link: string;
    published_at: string | null;
    status: "visible" | "excluded";
    sources: { id: string; name: string } | null;
    article_tags: ArticleTag[] | null;
    favorites: { id: string } | null;
  };
  isSubmitting: boolean;
  variant?: "default" | "favorite" | "excluded";
};

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getBorderColor(variant: "default" | "favorite" | "excluded"): string {
  switch (variant) {
    case "favorite":
      return "border-l-yellow-500";
    case "excluded":
      return "border-l-gray-400";
    default:
      return "border-l-orange-500";
  }
}

export function ArticleCard({ article, isSubmitting, variant = "default" }: ArticleCardProps) {
  const isFavorited = article.favorites !== null;
  const showTags = variant !== "excluded";
  const showPostDraft = variant !== "excluded";
  const showDeleteButton = variant !== "excluded";
  const showRestoreButton = variant === "excluded";
  const deleteFormRef = useRef<HTMLFormElement>(null);

  return (
    <Card className={`border-sidebar-border border-l-4 ${getBorderColor(variant)} bg-card p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Source name and time */}
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            {article.sources && <span>{article.sources.name}</span>}
            {article.published_at && (
              <>
                <span>-</span>
                <span>{formatRelativeTime(article.published_at)}</span>
              </>
            )}
          </div>

          {/* Title with external link */}
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-1 flex items-center gap-1"
          >
            <h3 className="font-medium group-hover:text-blue-500">{article.title}</h3>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>

          {/* Description */}
          {article.description && (
            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{article.description}</p>
          )}

          {/* Tags */}
          {showTags && (article.article_tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(article.article_tags ?? []).map(
                (at) =>
                  at.tags && (
                    <Badge key={at.tag_id} variant="secondary" className="text-xs">
                      {at.tags.name}
                    </Badge>
                  ),
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {showPostDraft && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="gap-1 text-purple-600"
              title="Coming soon"
            >
              Post Draft
            </Button>
          )}
          <RouterForm method="post">
            <input type="hidden" name="intent" value="favorite" />
            <input type="hidden" name="articleId" value={article.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={isSubmitting}
              className={
                isFavorited
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-muted-foreground hover:text-yellow-500"
              }
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className="h-4 w-4" style={{ fill: isFavorited ? "#eab308" : "none" }} />
            </Button>
          </RouterForm>
          {showDeleteButton && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  title="Delete article"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Article</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this article? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <RouterForm method="post" ref={deleteFormRef}>
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="articleId" value={article.id} />
                    <AlertDialogAction
                      type="submit"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </RouterForm>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {showRestoreButton && (
            <RouterForm method="post">
              <input type="hidden" name="intent" value="restore" />
              <input type="hidden" name="articleId" value={article.id} />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-green-600"
                title="Restore article"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </RouterForm>
          )}
        </div>
      </div>
    </Card>
  );
}
