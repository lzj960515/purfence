import * as React from 'react'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({ collapsed: false, setCollapsed: () => {} })

const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex h-screen">
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

const useSidebar = () => React.useContext(SidebarContext)

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
      {...props}
    />
  )
})
Sidebar.displayName = 'Sidebar'

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn('flex-1 overflow-auto py-2', className)}
      style={{ overflowX: collapsed ? 'hidden' : 'visible' }}
      {...props}
    />
  )
})
SidebarContent.displayName = 'SidebarContent'

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { collapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(collapsed ? 'px-2 py-2' : 'px-3 py-2', className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = 'SidebarGroup'

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useSidebar()

  if (collapsed) return null

  return (
    <div
      ref={ref}
      className={cn('mb-2 px-2 text-xs font-semibold text-muted-foreground', className)}
      {...props}
    >
      {children}
    </div>
  )
})
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
SidebarGroupContent.displayName = 'SidebarGroupContent'

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('space-y-1', className)}
    {...props}
  />
))
SidebarMenu.displayName = 'SidebarMenu'

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('', className)}
    {...props}
  />
))
SidebarMenuItem.displayName = 'SidebarMenuItem'

const SidebarMenuButton = React.forwardRef<
  HTMLAnchorElement,
  Omit<React.ComponentPropsWithoutRef<typeof Link>, 'to'> & {
    href: string
    icon?: LucideIcon
    isActive?: boolean
  }
>(({ className, href, icon: Icon, children, isActive: _isActive, ...props }, ref) => {
  const { collapsed } = useSidebar()
  const { pathname } = useLocation()

  const isActive = _isActive ?? href === pathname

  return (
    <Link
      ref={ref}
      to={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
        collapsed && 'justify-center px-2',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      {!collapsed && children}
    </Link>
  )
})
SidebarMenuButton.displayName = 'SidebarMenuButton'

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-1 flex-col overflow-y-auto', className)}
    {...props}
  />
))
SidebarInset.displayName = 'SidebarInset'

const SidebarTrigger = ({ className }: { className?: string }) => {
  const { collapsed, setCollapsed } = useSidebar()

  return (
    <button
      onClick={() => setCollapsed(!collapsed)}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'h-9 w-9',
        className
      )}
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
