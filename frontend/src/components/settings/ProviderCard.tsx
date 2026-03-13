import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Edit2, Trash2 } from 'lucide-react'
import type { ProviderConfig } from '@/hooks/useProviderConfigs'

interface ProviderCardProps {
  config: ProviderConfig
  onEdit: (config: ProviderConfig) => void
  onDelete: (config: ProviderConfig) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

const PROVIDER_NAMES: Record<string, string> = {
  KIMI: 'Kimi',
  ZHIPU: 'Zhipu',
  OPENAI: 'OpenAI',
  OPENAI_COMPATIBLE: 'OpenAI Compatible',
  CODEX: 'Codex',
}

function normalizeEnumValue(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  return value.toUpperCase()
}

function getProviderLabel(provider: unknown): string {
  const providerKey = normalizeEnumValue(provider)
  return PROVIDER_NAMES[providerKey] || (typeof provider === 'string' ? provider : 'Unknown Provider')
}

export function ProviderCard({
  config,
  onEdit,
  onDelete,
  onToggleActive,
}: ProviderCardProps) {
  const providerDisplayName = getProviderLabel(config.provider)

  return (
    <div className="group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold leading-none tracking-tight truncate">
              {config.name}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {providerDisplayName} {config.baseUrl ? `• ${config.baseUrl}` : ''}
          </p>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>启用</span>
            <Switch
              checked={config.isActive}
              onCheckedChange={(checked) => onToggleActive(config.id, checked)}
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(config)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(config)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
