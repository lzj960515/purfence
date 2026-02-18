import { useMemo, useState } from "react";
import { Copy, ExternalLink, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  type AppConfigInput,
  type AppConfigItem,
  type AppConfigType,
  useAppConfigs,
} from "@/hooks/useAppConfigs";
import { DeleteConfirmDialog } from "@/components/settings/DeleteConfirmDialog";

type FormState = {
  name: string;
  type: AppConfigType;
  enabled: boolean;
  botToken: string;
  appToken: string;
};

const SLACK_BOT_MANIFEST = `{
  "display_information": {
    "name": "ziwei",
    "description": "紫微",
    "background_color": "#14361c"
  },
  "features": {
    "bot_user": {
      "display_name": "ziwei",
      "always_online": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "chat:write",
        "chat:write.public",
        "groups:history",
        "im:history",
        "mpim:history",
        "users:read",
        "users:read.email",
        "files:read",
        "files:write"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}`;

function readSlackConfig(config?: Record<string, unknown>) {
  return {
    botToken: String(config?.botToken || ""),
    appToken: String(config?.appToken || ""),
  };
}

function toInput(state: FormState): AppConfigInput {
  return {
    name: state.name,
    type: state.type,
    enabled: state.enabled,
    config: {
      botToken: state.botToken,
      appToken: state.appToken,
    },
  };
}

export function AppConfigPage() {
  const { toast } = useToast();
  const { items, loading, error, createItem, updateItem, deleteItem } =
    useAppConfigs();

  const [editingItem, setEditingItem] = useState<AppConfigItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AppConfigItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const copyManifest = async () => {
    try {
      await navigator.clipboard.writeText(SLACK_BOT_MANIFEST);
      toast({ title: "已复制", description: "Slack Manifest 已复制到剪贴板" });
    } catch (err) {
      toast({
        title: "复制失败",
        description: err instanceof Error ? err.message : "请手动复制下方内容",
        variant: "destructive",
      });
    }
  };

  const [form, setForm] = useState<FormState>({
    name: "",
    type: "SLACK",
    enabled: true,
    botToken: "",
    appToken: "",
  });

  const title = useMemo(
    () => (editingItem ? "编辑 App 配置" : "添加 App 配置"),
    [editingItem],
  );

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      name: "",
      type: "SLACK",
      enabled: true,
      botToken: "",
      appToken: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: AppConfigItem) => {
    const slack = readSlackConfig(item.config);
    setEditingItem(item);
    setForm({
      name: item.name,
      type: item.type,
      enabled: item.enabled,
      botToken: slack.botToken,
      appToken: slack.appToken,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.botToken.trim() || !form.appToken.trim()) {
      toast({
        title: "请完善配置",
        description: "名称、Bot Token 和 App Token 不能为空",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = toInput(form);
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        toast({ title: "成功", description: "App 配置已更新" });
      } else {
        await createItem(payload);
        toast({ title: "成功", description: "App 配置已创建" });
      }
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: "失败",
        description: err instanceof Error ? err.message : "保存配置失败",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (item: AppConfigItem, enabled: boolean) => {
    try {
      await updateItem(item.id, { enabled });
      toast({ title: "成功", description: enabled ? "已启用" : "已禁用" });
    } catch (err) {
      toast({
        title: "失败",
        description: err instanceof Error ? err.message : "更新状态失败",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    await deleteItem(deletingItem.id);
    setDeletingItem(null);
    toast({ title: "成功", description: "App 配置已删除" });
  };

  if (loading) {
    return <div className="py-8 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          加载失败：{error.message}
        </div>
      )}

      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">App</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理第三方 App 接入配置（当前支持 Slack）
          </p>
        </div>
        <Button className="gap-2 sm:w-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          添加配置
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-medium">Slack Bot 创建指引</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              按下面步骤创建 Slack App，再把 Bot Token / App Token 填到本页配置里。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer">
                打开 Slack Apps
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={copyManifest}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              复制 Manifest
            </Button>
          </div>
        </div>

        <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
          <li>进入 Slack Apps，点击 Create New App。</li>
          <li>选择 From a manifest。</li>
          <li>粘贴下方 Manifest，按需修改 name / description / display_name 后创建。</li>
          <li>
            Basic Information → App-Level Tokens：创建 token（name 随意），scope 添加
            <code className="mx-1 rounded bg-muted px-1 py-0.5">connections:write</code>。
          </li>
          <li>复制 App Token（通常是 xapp- 开头）。</li>
          <li>
            App Home → Messages Tab：勾选 Allow users to send Slash commands and messages from the messages tab。
          </li>
          <li>Install App 完成安装。</li>
          <li>复制 Bot Token（通常是 xoxb- 开头）。</li>
        </ol>

        <p className="mt-3 text-xs text-muted-foreground">可选：在 Basic Information 给 App 换个头像。</p>

        <div className="mt-4 rounded-lg border bg-muted/40 p-3">
          <pre className="max-h-72 overflow-auto text-xs leading-5">{SLACK_BOT_MANIFEST}</pre>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            暂无 App 配置，先添加一个 Slack 配置。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            return (
              <div key={item.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Settings2 className="h-4 w-4" />
                      <span>Type: {String(item.type).toLowerCase()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        启用
                      </span>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(next) => toggleEnabled(item, next)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeletingItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              当前只开放 Slack，后续会支持更多 App 类型。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, type: value as AppConfigType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SLACK">slack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                value={form.botToken}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, botToken: e.target.value }))
                }
                placeholder="xoxb-..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appToken">App Token</Label>
              <Input
                id="appToken"
                value={form.appToken}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, appToken: e.target.value }))
                }
                placeholder="xapp-..."
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="enabled">启用该 App</Label>
              <Switch
                id="enabled"
                checked={form.enabled}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deletingItem}
        configName={deletingItem?.name || ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
