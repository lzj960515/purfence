import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CalendarIcon, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";
import {
  de,
  enUS,
  es,
  fr,
  ja,
  ko,
  ptBR,
  ru,
  zhCN,
  zhTW,
} from "date-fns/locale";
import {
  CREATE_PURFENCE_SCHEDULED_TASK_MUTATION,
  DELETE_PURFENCE_SCHEDULED_TASK_MUTATION,
  PURFENCE_SCHEDULED_TASKS_QUERY,
  RUN_PURFENCE_SCHEDULED_TASK_MUTATION,
  UPDATE_PURFENCE_SCHEDULED_TASK_MUTATION,
} from "@/api/scheduled-task.graphql";
import { GET_APP_CONFIGS } from "@/api/app-config.graphql";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type TaskKindMode = "daily" | "weekly" | "monthly" | "one_time";

type ScheduledTaskItem = {
  id: string;
  name: string;
  prompt: string;
  kind: "recurring" | "one_time";
  cronExpr?: string | null;
  runAt?: string | null;
  enabled: boolean;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  lastStatus?: "success" | "failed" | null;
  lastError?: string | null;
  runCount: number;
  slackAppConfigId?: string | null;
  slackChannelId?: string | null;
};

type AppConfigOption = {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
};

const REPEAT_OPTIONS: Array<{ value: TaskKindMode; label: string }> = [
  { value: "daily", label: "每天" },
  { value: "weekly", label: "每周" },
  { value: "monthly", label: "每月" },
  { value: "one_time", label: "不重复" },
];

const WEEKDAY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "周一", value: "1" },
  { label: "周二", value: "2" },
  { label: "周三", value: "3" },
  { label: "周四", value: "4" },
  { label: "周五", value: "5" },
  { label: "周六", value: "6" },
  { label: "周日", value: "0" },
];

function toLocalDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseHHMM(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function resolveCalendarLocale(localeText?: string) {
  const lower = (localeText || "").toLowerCase();
  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk")) return zhTW;
  if (lower.startsWith("zh")) return zhCN;
  if (lower.startsWith("ja")) return ja;
  if (lower.startsWith("ko")) return ko;
  if (lower.startsWith("fr")) return fr;
  if (lower.startsWith("de")) return de;
  if (lower.startsWith("es")) return es;
  if (lower.startsWith("pt")) return ptBR;
  if (lower.startsWith("ru")) return ru;
  return enUS;
}

export function ScheduledTaskSettingsPage() {
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskEnabled, setEditingTaskEnabled] = useState(true);
  const [mode, setMode] = useState<TaskKindMode>("one_time");
  const [timeOfDay, setTimeOfDay] = useState("08:00");
  const [weeklyDays, setWeeklyDays] = useState<string[]>(["1"]);
  const [monthlyDay, setMonthlyDay] = useState("1");
  const [runDate, setRunDate] = useState<Date | undefined>(new Date());
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);
  const [calendarLocale, setCalendarLocale] = useState(enUS);
  const [saving, setSaving] = useState(false);
  const [slackAppConfigId, setSlackAppConfigId] = useState("");
  const [slackChannelId, setSlackChannelId] = useState("");

  useEffect(() => {
    const options = Intl.DateTimeFormat().resolvedOptions();
    setTimeZone(options.timeZone);
    setCalendarLocale(resolveCalendarLocale(options.locale || navigator.language));
  }, []);

  const { data, loading, error, refetch } = useQuery(
    PURFENCE_SCHEDULED_TASKS_QUERY,
    {
      variables: {
        paging: { offset: 0, limit: 50 },
        sorting: [{ field: "updatedAt", direction: "DESC" }],
      },
      fetchPolicy: "network-only",
    },
  );
  const { data: appConfigData } = useQuery(GET_APP_CONFIGS, {
    fetchPolicy: "network-only",
  });

  const [createTask] = useMutation(CREATE_PURFENCE_SCHEDULED_TASK_MUTATION);
  const [updateTask] = useMutation(UPDATE_PURFENCE_SCHEDULED_TASK_MUTATION);
  const [deleteTask] = useMutation(DELETE_PURFENCE_SCHEDULED_TASK_MUTATION);
  const [runTask] = useMutation(RUN_PURFENCE_SCHEDULED_TASK_MUTATION);

  const tasks: ScheduledTaskItem[] = useMemo(
    () => data?.purfenceScheduledTasks?.nodes ?? [],
    [data?.purfenceScheduledTasks?.nodes],
  );

  const slackApps: AppConfigOption[] = useMemo(() => {
    const nodes = appConfigData?.purfenceAppConfigs?.nodes ?? [];
    return nodes
      .filter((item: AppConfigOption) => item.type?.toLowerCase() === "slack" && item.enabled)
      .map((item: AppConfigOption) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        enabled: item.enabled,
      }));
  }, [appConfigData?.purfenceAppConfigs?.nodes]);

  const weeklyLabel = useMemo(() => {
    if (weeklyDays.length === 0) return "选择星期";
    return WEEKDAY_OPTIONS.filter((day) => weeklyDays.includes(day.value))
      .map((day) => day.label)
      .join("、");
  }, [weeklyDays]);

  const resetForm = () => {
    setEditingTaskId(null);
    setEditingTaskEnabled(true);
    setName("");
    setPrompt("");
    setMode("one_time");
    setTimeOfDay("08:00");
    setWeeklyDays(["1"]);
    setMonthlyDay("1");
    setRunDate(new Date());
    setSlackAppConfigId("");
    setSlackChannelId("");
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const fillFormFromTask = (task: ScheduledTaskItem) => {
    setEditingTaskId(task.id);
    setEditingTaskEnabled(task.enabled);
    setName(task.name);
    setPrompt(task.prompt);
    setSlackAppConfigId(task.slackAppConfigId || "");
    setSlackChannelId(task.slackChannelId || "");

    if (task.kind === "one_time") {
      setMode("one_time");
      const runAt = task.runAt ? new Date(task.runAt) : new Date();
      setRunDate(runAt);
      setTimeOfDay(
        `${String(runAt.getHours()).padStart(2, "0")}:${String(runAt.getMinutes()).padStart(2, "0")}`,
      );
      return;
    }

    const parts = (task.cronExpr || "").trim().split(/\s+/);
    if (parts.length >= 5) {
      const minute = parts[0] || "0";
      const hour = parts[1] || "8";
      const dayOfMonth = parts[2] || "*";
      const dayOfWeek = parts[4] || "*";

      setTimeOfDay(
        `${String(Number(hour)).padStart(2, "0")}:${String(Number(minute)).padStart(2, "0")}`,
      );

      if (dayOfWeek !== "*") {
        setMode("weekly");
        const days = dayOfWeek
          .split(",")
          .map((it) => it.trim())
          .filter(Boolean);
        setWeeklyDays(days.length > 0 ? days : ["1"]);
      } else if (dayOfMonth !== "*") {
        setMode("monthly");
        setMonthlyDay(dayOfMonth);
      } else {
        setMode("daily");
      }
      return;
    }

    setMode("daily");
  };

  const buildCronExpr = () => {
    const parsed = parseHHMM(timeOfDay);
    if (!parsed) {
      throw new Error("时间格式无效，请使用 HH:mm");
    }

    if (mode === "daily") {
      return `${parsed.minute} ${parsed.hour} * * *`;
    }

    if (mode === "weekly") {
      if (weeklyDays.length === 0) {
        throw new Error("每周任务至少选择一个星期");
      }
      const sortedDays = [...weeklyDays].sort((a, b) => Number(a) - Number(b));
      return `${parsed.minute} ${parsed.hour} * * ${sortedDays.join(",")}`;
    }

    if (mode === "monthly") {
      const day = Number(monthlyDay);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        throw new Error("每月日期必须在 1-31 之间");
      }
      return `${parsed.minute} ${parsed.hour} ${day} * *`;
    }

    return undefined;
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPrompt = prompt.trim();
    if (!trimmedName || !trimmedPrompt) {
      toast({
        title: "创建失败",
        description: "标题和提示词不能为空",
        variant: "destructive",
      });
      return;
    }

    if (!slackAppConfigId || !slackChannelId.trim()) {
      toast({
        title: editingTaskId ? "更新失败" : "创建失败",
        description: "请选择 Slack App 并填写 Channel ID",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (mode === "one_time") {
        const parsed = parseHHMM(timeOfDay);
        if (!parsed || !runDate) {
          throw new Error("请先选择执行日期和时间");
        }

        const runAt = new Date(runDate);
        runAt.setHours(parsed.hour, parsed.minute, 0, 0);

        if (editingTaskId) {
          await updateTask({
            variables: {
              id: editingTaskId,
              update: {
                name: trimmedName,
                prompt: trimmedPrompt,
                kind: "one_time",
                runAt: runAt.toISOString(),
                enabled: editingTaskEnabled,
                slackAppConfigId,
                slackChannelId: slackChannelId.trim(),
              },
            },
          });
        } else {
          await createTask({
            variables: {
              input: {
                name: trimmedName,
                prompt: trimmedPrompt,
                kind: "one_time",
                runAt: runAt.toISOString(),
                enabled: true,
                slackAppConfigId,
                slackChannelId: slackChannelId.trim(),
              },
            },
          });
        }
      } else {
        if (editingTaskId) {
          await updateTask({
            variables: {
              id: editingTaskId,
              update: {
                name: trimmedName,
                prompt: trimmedPrompt,
                kind: "recurring",
                cronExpr: buildCronExpr(),
                enabled: editingTaskEnabled,
                slackAppConfigId,
                slackChannelId: slackChannelId.trim(),
              },
            },
          });
        } else {
          await createTask({
            variables: {
              input: {
                name: trimmedName,
                prompt: trimmedPrompt,
                kind: "recurring",
                cronExpr: buildCronExpr(),
                enabled: true,
                slackAppConfigId,
                slackChannelId: slackChannelId.trim(),
              },
            },
          });
        }
      }

      toast({
        title: editingTaskId ? "更新成功" : "创建成功",
        description: editingTaskId ? "定时任务已更新。" : "定时任务已创建。",
      });
      setDialogOpen(false);
      resetForm();
      await refetch();
    } catch (err) {
      toast({
        title: editingTaskId ? "更新失败" : "创建失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (
    task: ScheduledTaskItem,
    enabled: boolean,
  ) => {
    try {
      await updateTask({
        variables: {
          id: task.id,
          update: { enabled },
        },
      });
      await refetch();
    } catch (err) {
      toast({
        title: "更新失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleRunNow = async (task: ScheduledTaskItem) => {
    try {
      const result = await runTask({ variables: { id: task.id } });
      const threadId = result.data?.runPurfenceScheduledTask;
      toast({
        title: "已触发执行",
        description: "已为你新建 AI 会话并发送任务。",
      });
      await refetch();
      void threadId;
    } catch (err) {
      toast({
        title: "执行失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (task: ScheduledTaskItem) => {
    try {
      await deleteTask({ variables: { id: task.id } });
      toast({ title: "删除成功" });
      await refetch();
    } catch (err) {
      toast({
        title: "删除失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            定时任务
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            在指定时间自动新建 AI 会话并发送 Prompt。
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-black text-white hover:bg-black/90"
        >
          <Plus className="h-4 w-4" />
          新建任务
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl">
              {editingTaskId ? "编辑定时任务" : "添加定时任务"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="每日站会纪要"
              />
            </div>

            <div className="space-y-2">
              <Label>提示词</Label>
              <Textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="请总结今天的项目进展，并输出一段可直接发送到群里的日报。"
              />
            </div>

            <div className="space-y-3">
              <Label>计划</Label>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <Select
                  value={mode}
                  onValueChange={(value) => setMode(value as TaskKindMode)}
                >
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="选择计划" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEAT_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {mode === "weekly" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full lg:w-[180px] justify-start font-normal"
                      >
                        {weeklyLabel}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52" align="start">
                      {WEEKDAY_OPTIONS.map((day) => (
                        <DropdownMenuCheckboxItem
                          key={day.value}
                          checked={weeklyDays.includes(day.value)}
                          onCheckedChange={(checked) => {
                            setWeeklyDays((prev) => {
                              if (checked) {
                                if (prev.includes(day.value)) return prev;
                                return [...prev, day.value];
                              }
                              if (prev.length === 1 && prev[0] === day.value) {
                                return prev;
                              }
                              return prev.filter((item) => item !== day.value);
                            });
                          }}
                        >
                          {day.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : mode === "monthly" ? (
                  <Select value={monthlyDay} onValueChange={setMonthlyDay}>
                    <SelectTrigger className="w-full lg:w-[140px]">
                      <SelectValue placeholder="选择日期" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => `${i + 1}`).map(
                        (day) => (
                          <SelectItem key={day} value={day}>
                            {day}号
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                ) : mode === "one_time" ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start font-normal w-full lg:w-[180px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {runDate ? toLocalDateInput(runDate) : "选择日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={runDate}
                        onSelect={setRunDate}
                        timeZone={timeZone}
                        locale={calendarLocale}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div />
                )}

                <Input
                  type="time"
                  step={300}
                  className="w-full lg:w-[130px] bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slack App</Label>
              <Select value={slackAppConfigId} onValueChange={setSlackAppConfigId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择 App" />
                </SelectTrigger>
                <SelectContent>
                  {slackApps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slackChannelId">Slack Channel ID</Label>
              <Input
                id="slackChannelId"
                value={slackChannelId}
                onChange={(e) => setSlackChannelId(e.target.value)}
                placeholder="C0123456789"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "保存中..." : editingTaskId ? "更新" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
          加载失败：{error.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无定时任务</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-[1.5fr_1.4fr_auto_auto] gap-4 px-4 py-3 text-muted-foreground text-sm border-b">
                <div>标题</div>
                <div>计划于</div>
                <div>状态</div>
                <div className="w-10" />
              </div>

              {tasks.map((task) => {
                const plannedAt = task.nextRunAt || task.runAt;
                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-[1.5fr_1.4fr_auto_auto] gap-4 px-4 py-4 items-center border-b last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{task.name}</div>
                      {task.lastError && (
                        <div className="text-xs text-destructive truncate mt-1">
                          {task.lastError}
                        </div>
                      )}
                    </div>

                    <div className="text-muted-foreground text-sm">
                      {plannedAt
                        ? new Date(plannedAt).toLocaleString()
                        : "-"}
                    </div>

                    <div>
                      <Switch
                        checked={task.enabled}
                        onCheckedChange={(checked) => {
                          void handleToggleEnabled(task, checked);
                        }}
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => {
                            void handleRunNow(task);
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          立即运行
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            fillFormFromTask(task);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            void handleDelete(task);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
