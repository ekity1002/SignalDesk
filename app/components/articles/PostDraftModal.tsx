import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

type Prompt = {
  id: string;
  name: string;
  template: string;
  is_default: boolean;
};

type ArticleContext = {
  title: string;
  description?: string;
  link: string;
  publishedAt?: string;
  matchedTags?: string[];
};

type PostDraftModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: ArticleContext;
  prompts: Prompt[];
};

export function PostDraftModal({ open, onOpenChange, article, prompts }: PostDraftModalProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set default prompt when modal opens
  useEffect(() => {
    if (open && prompts.length > 0) {
      const defaultPrompt = prompts.find((p) => p.is_default) || prompts[0];
      setSelectedPromptId(defaultPrompt.id);
      setGeneratedText("");
      setError(null);
      setCopied(false);
    }
  }, [open, prompts]);

  // Cleanup: abort request when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Prevent closing modal while generating
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && isGenerating) {
        // Don't allow closing while generating
        return;
      }
      if (!newOpen && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      onOpenChange(newOpen);
    },
    [isGenerating, onOpenChange],
  );

  const handleGenerate = useCallback(async () => {
    const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
    if (!selectedPrompt) {
      setError("Please select a prompt");
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: selectedPrompt.template,
          article,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate post");
      }

      const data = await response.json();
      setGeneratedText(data.post.text);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [selectedPromptId, prompts, article]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }, [generatedText]);

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Post Draft</DialogTitle>
          <DialogDescription>Generate a Slack post for: {article.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prompt Selection */}
          <div className="space-y-2">
            <label htmlFor="prompt-select" className="text-sm font-medium">
              Select Prompt Template
            </label>
            <Select
              value={selectedPromptId}
              onValueChange={setSelectedPromptId}
              disabled={isGenerating}
            >
              <SelectTrigger id="prompt-select">
                <SelectValue placeholder="Select a prompt template" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.name}
                    {prompt.is_default && " (Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPrompt && (
              <p className="text-xs text-muted-foreground">
                Template: {selectedPrompt.template.slice(0, 100)}
                {selectedPrompt.template.length > 100 && "..."}
              </p>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedPromptId}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : generatedText ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </>
            ) : (
              "Generate Post"
            )}
          </Button>

          {/* Error Message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Generated Text */}
          {generatedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="generated-text" className="text-sm font-medium">
                  Generated Post
                </label>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="generated-text"
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          )}

          {/* Prompts Empty State */}
          {prompts.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No prompt templates found. Please create one in Settings.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
