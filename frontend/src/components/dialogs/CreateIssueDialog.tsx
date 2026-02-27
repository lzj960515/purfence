import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string, slug: string, description: string) => void;
  loading?: boolean;
  projectName?: string;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  onCreate,
  loading = false,
  projectName,
}: CreateIssueDialogProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const canCreate =
    title.trim().length > 0 &&
    slug.trim().length > 0 &&
    description.trim().length > 0;

  // 从标题自动生成 slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // 如果 slug 还没填，自动填充
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate(title.trim(), slug.trim(), description.trim());
    setTitle("");
    setSlug("");
    setDescription("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      setTitle("");
      setSlug("");
      setDescription("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新建需求</DialogTitle>
          <DialogDescription>
            {projectName && (
              <span className="flex items-center gap-2">
                <span>当前项目：</span>
                <Badge variant="secondary">{projectName}</Badge>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="issue-title">
              需求标题 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="例如：新增待办清单功能"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-slug">
              英文标识 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="issue-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="例如：feature-todo-list"
            />
            <p className="text-xs text-muted-foreground">
              用于工作目录名，只能用小写字母、数字和连字符
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-desc">
              需求描述 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="尽量说清楚你想解决的问题、目标用户、核心流程与边界"
              rows={10}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button disabled={!canCreate || loading} onClick={handleCreate}>
            {loading ? "创建中…" : "创建并执行"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
