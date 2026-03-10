import { useNavigate, useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { SettingsSidebar } from '@/components/settings/SettingsSidebar'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type SettingsTab =
  | 'base'
  | 'providers'
  | 'scheduled-tasks'
  | 'app'
  | 'skills'
  | 'queue'

export function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true)
      } else {
        setIsSidebarCollapsed(false)
      }
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 从 URL 路径确定当前 tab
  const activeTab = (location.pathname.split('/').pop() || 'base') as SettingsTab

  const handleTabChange = (tab: SettingsTab) => {
    navigate(`/settings/${tab}`)
  }

  return (
    <div className="flex h-full bg-background">
      <div 
        className={cn(
          "flex-shrink-0 border-r bg-muted/10 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <SettingsSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          collapsed={isSidebarCollapsed}
          onCollapseChange={setIsSidebarCollapsed}
        />
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto py-10 px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
