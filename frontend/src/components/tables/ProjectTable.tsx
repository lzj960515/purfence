import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  FolderKanban,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export interface Project {
  id: string
  name: string
  description: string | null
  localRootPath: string
  createdAt: string
  updatedAt: string
}

interface ProjectTableProps {
  projects: Project[]
  loading?: boolean
}

export function ProjectTable({ projects, loading }: ProjectTableProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <div className="text-sm text-muted-foreground">暂无项目</div>
        <div className="mt-1 text-xs text-muted-foreground/70">点击右上角「新建项目」创建第一个项目</div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>项目名称</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>本地路径</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {project.description ?? '-'}
              </TableCell>
              <TableCell className="max-w-[250px] truncate font-mono text-xs text-muted-foreground">
                {project.localRootPath}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(project.createdAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/projects/${project.id}`)
                    }}
                    >
                      查看详情
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
