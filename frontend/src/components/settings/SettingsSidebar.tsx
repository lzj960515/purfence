import {
  Package,
  Bot,
  SlidersHorizontal,
  PanelLeft,
  MonitorCog,
  AlarmClock,
  AppWindow,
  Blocks,
  ListOrdered,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type SettingsTab =
  | 'base'
  | 'providers'
  | 'claude-code'
  | 'environment'
  | 'scheduled-tasks'
  | 'app'
  | 'skills'
  | 'queue'

interface SettingsSidebarProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  onCollapseChange?: (collapsed: boolean) => void
  collapsed?: boolean
}

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active: boolean
  disabled?: boolean
  tooltip?: string
  onClick?: () => void
  collapsed?: boolean
}

function SidebarItem({
  icon,
  label,
  active,
  disabled = false,
  tooltip,
  onClick,
  collapsed = false,
}: SidebarItemProps) {
  const button = (
    <Button
      variant="ghost"
      className={cn(
        'w-full h-9 px-2',
        collapsed ? 'justify-center' : 'justify-start gap-2',
        active 
          ? 'bg-muted font-medium text-foreground' 
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span className="text-sm">{label}</span>}
    </Button>
  )

  if (disabled && tooltip) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

export function SettingsSidebar({ activeTab, onTabChange, onCollapseChange, collapsed = false }: SettingsSidebarProps) {
  return (
    <div className={cn("h-full py-4 flex flex-col transition-all duration-300 relative", collapsed ? "px-2" : "px-3")}>
      <div className={cn("flex items-center mb-4 px-2 h-8", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && <span className="font-semibold text-sm">设置</span>}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => onCollapseChange?.(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
      <nav className="space-y-1 flex-1">
        <SidebarItem
          icon={<SlidersHorizontal className="h-4 w-4" />}
          label="通用"
          active={activeTab === 'base'}
          onClick={() => onTabChange('base')}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={<Package className="h-4 w-4" />}
          label="模型提供商"
          active={activeTab === 'providers'}
          onClick={() => onTabChange('providers')}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={<Bot className="h-4 w-4" />}
          label="Claude Code"
          active={activeTab === 'claude-code'}
          onClick={() => onTabChange('claude-code')}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={<MonitorCog className="h-4 w-4" />}
          label="环境检查"
          active={activeTab === 'environment'}
          onClick={() => onTabChange('environment')}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={<AlarmClock className="h-4 w-4" />}
          label="定时任务"
          active={activeTab === 'scheduled-tasks'}
          onClick={() => onTabChange('scheduled-tasks')}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={<AppWindow className="h-4 w-4" />}
          label="App"
          active={activeTab === 'app'}
          onClick={() => onTabChange('app')}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={<Blocks className="h-4 w-4" />}
          label="Skills"
          active={activeTab === 'skills'}
          onClick={() => onTabChange('skills')}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={<ListOrdered className="h-4 w-4" />}
          label="队列管理"
          active={activeTab === 'queue'}
          onClick={() => onTabChange('queue')}
          collapsed={collapsed}
        />
      </nav>
    </div>
  )
}
