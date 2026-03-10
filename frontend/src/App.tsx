import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProjectListPage } from '@/pages/ProjectListPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { IssueDetailPage } from '@/pages/IssueDetailPage'
import { AgentPage } from '@/pages/AgentPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ProviderConfigPage } from '@/pages/ProviderConfigPage'
import { PurfenceConfigPage } from '@/pages/PurfenceConfigPage'
import { OnboardingPage, hasOnboardingCompleted } from '@/pages/OnboardingPage'
import { Toaster } from '@/components/ui/sonner'
import { ScheduledTaskSettingsPage } from '@/pages/ScheduledTaskSettingsPage'
import { AppConfigPage } from '@/pages/AppConfigPage'
import { SkillsSettingsPage } from '@/pages/SkillsSettingsPage'
import { QueueManagementPage } from '@/pages/QueueManagementPage'
import { ErrorBoundary } from '@/components/error'

function RootRedirect() {
  return hasOnboardingCompleted() ? (
    <Navigate to="/agent" replace />
  ) : (
    <Navigate to="/onboarding" replace />
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<AdminLayout><Outlet /></AdminLayout>}>
            <Route index element={<RootRedirect />} />
            <Route path="projects" element={<ProjectListPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="issues/:id" element={<IssueDetailPage />} />
            <Route path="agent" element={<AgentPage />} />
            <Route path="settings" element={<SettingsPage />}>
              <Route index element={<Navigate to="/settings/base" replace />} />
              <Route path="base" element={<PurfenceConfigPage />} />
              <Route path="providers" element={<ProviderConfigPage />} />
              <Route path="scheduled-tasks" element={<ScheduledTaskSettingsPage />} />
              <Route path="app" element={<AppConfigPage />} />
              <Route path="skills" element={<SkillsSettingsPage />} />
              <Route path="queue" element={<QueueManagementPage />} />
              <Route path="queue/:queueId" element={<QueueManagementPage />} />
            </Route>
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
