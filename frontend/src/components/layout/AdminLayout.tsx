import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

interface AdminLayoutProps {
  children?: React.ReactNode
}

const SIDEBAR_COLLAPSE_BREAKPOINT = 1024

function ResponsiveSidebarController() {
  const { setCollapsed } = useSidebar()

  useEffect(() => {
    const updateSidebarState = () => {
      setCollapsed(window.innerWidth < SIDEBAR_COLLAPSE_BREAKPOINT)
    }

    updateSidebarState()
    window.addEventListener('resize', updateSidebarState)

    return () => {
      window.removeEventListener('resize', updateSidebarState)
    }
  }, [setCollapsed])

  return null
}

function getBreadcrumbs(pathname: string) {
  // Handle detail pages
  if (pathname.match(/^\/projects\/[^/]+$/)) {
    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/projects">项目列表</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>项目详情</BreadcrumbPage>
        </BreadcrumbItem>
      </>
    )
  }
  // Handle list pages
  if (pathname === '/projects') {
    return (
      <BreadcrumbItem>
        <BreadcrumbPage>项目列表</BreadcrumbPage>
      </BreadcrumbItem>
    )
  }
  if (pathname === '/agent') {
    return (
      <BreadcrumbItem>
        <BreadcrumbPage>AI 对话</BreadcrumbPage>
      </BreadcrumbItem>
    )
  }
  if (pathname === '/agents') {
    return (
      <BreadcrumbItem>
        <BreadcrumbPage>Agents</BreadcrumbPage>
      </BreadcrumbItem>
    )
  }
  return null
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { pathname } = useLocation()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <SidebarProvider>
      <ResponsiveSidebarController />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            {breadcrumbs && (
              <>
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb>
                  <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
                </Breadcrumb>
              </>
            )}
          </div>
        </header>
        <div className="flex flex-1 min-h-0 flex-col gap-4 p-4 pt-0">
          {children || <Outlet />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
