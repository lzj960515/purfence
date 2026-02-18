import { useState, useEffect } from 'react';
import { Search, Check, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchTools } from '@/api/agent.api';
import type { Tool } from '@/lib/socket-agent';

interface ToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTools: string[];
  onSelectedToolsChange: (tools: string[]) => void;
}

export function ToolsDialog({
  open,
  onOpenChange,
  selectedTools,
  onSelectedToolsChange,
}: ToolsDialogProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载工具列表
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchTools()
      .then(setTools)
      .catch((err) => console.error('Failed to load tools:', err))
      .finally(() => setLoading(false));
  }, [open]);

  // 过滤工具
  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 切换工具选择状态
  const toggleTool = (toolName: string) => {
    if (selectedTools.includes(toolName)) {
      onSelectedToolsChange(selectedTools.filter((t) => t !== toolName));
    } else {
      onSelectedToolsChange([...selectedTools, toolName]);
    }
  };

  // 清除所有选择
  const clearAll = () => {
    onSelectedToolsChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>选择工具</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索工具名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清除全部
          </Button>
          <span className="text-muted-foreground">
            已选择 {selectedTools.length} / {tools.length} 个工具
          </span>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px] max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">加载工具...</div>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">没有找到匹配的工具</div>
            </div>
          ) : (
            filteredTools.map((tool) => {
              const isSelected = selectedTools.includes(tool.name);
              return (
                <button
                  key={tool.name}
                  onClick={() => toggleTool(tool.name)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isSelected ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {tool.name}
                        </Badge>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => onOpenChange(true)}>
            保存选择
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
