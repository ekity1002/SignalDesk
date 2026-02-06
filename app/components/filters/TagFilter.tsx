import { Filter } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";

type Tag = {
  id: string;
  name: string;
};

type TagFilterProps = {
  tags: Tag[];
};

export function TagFilter({ tags }: TagFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTagIds = searchParams.getAll("tags");

  const handleTagChange = (tagId: string, checked: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("tags");
    newParams.delete("page");

    const newSelectedIds = checked
      ? [...selectedTagIds, tagId]
      : selectedTagIds.filter((id) => id !== tagId);

    for (const id of newSelectedIds) {
      newParams.append("tags", id);
    }

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("tags");
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const selectedCount = selectedTagIds.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[90px] justify-start gap-2">
          <Filter className="h-4 w-4" />
          Tags
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              selectedCount > 0 ? "bg-primary text-primary-foreground" : "opacity-0"
            }`}
          >
            {selectedCount || 0}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filter by tags</h4>
            {selectedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto px-2 py-1">
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags available</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTagIds.includes(tag.id)}
                    onCheckedChange={(checked) => handleTagChange(tag.id, checked === true)}
                  />
                  <label
                    htmlFor={`tag-${tag.id}`}
                    className="cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
