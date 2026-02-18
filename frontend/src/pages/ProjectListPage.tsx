import { useState } from 'react'
import { usePurfenceProjectsQuery } from '@/graphql/__generated__/hooks'
import { useCreateOnePurfenceProjectMutation } from '@/graphql/__generated__/hooks'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog'
import { ProjectTable, type Project } from '@/components/tables/ProjectTable'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ProjectListPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data, loading, error, refetch } = usePurfenceProjectsQuery({
    variables: {
      paging: { limit: 50, offset: 0 },
      sorting: [{ field: 'createdAt', direction: 'DESC' }],
    },
  })

  const [createProject, { loading: creating }] = useCreateOnePurfenceProjectMutation({
    onCompleted: (data) => {
      if (data.createOnePurfenceProject) {
        setCreateDialogOpen(false)
        refetch()
      }
    },
    onError: (error) => {
      console.error('Failed to create project:', error)
    },
  })

  const projects = data?.purfenceProjects?.nodes ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">项目列表</h2>
          <p className="text-muted-foreground">
            管理你的所有项目
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">加载失败</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <ProjectTable
        projects={projects as Project[]}
        loading={loading}
      />

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={({ name, slug, description, externalPath }) => {
          createProject({
            variables: {
              input: {
                purfenceProject: { name, slug, description, externalPath },
              },
            },
          })
        }}
        loading={creating}
      />
    </div>
  )
}
