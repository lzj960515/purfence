import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Bot,
  File,
  FileText,
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { ChatArtifact, ChatMessage } from '@/lib/socket-agent';
import { getBackendBaseUrl } from '@/lib/backend';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
}

const getImageUrl = (artifact: ChatArtifact): string | undefined => {
  const rawUrl = artifact.content.url;
  if (!rawUrl) {
    return undefined;
  }

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
    return rawUrl;
  }

  const backendBaseUrl = getBackendBaseUrl();
  const baseUrl = backendBaseUrl || '';
  return `${baseUrl}/api/agent/file?path=${encodeURIComponent(rawUrl)}`;
};

const getFileHref = (artifact: ChatArtifact): string | undefined => {
  const rawUrl = artifact.content.fileUrl;
  if (!rawUrl) {
    return undefined;
  }

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('file://')) {
    return rawUrl;
  }

  const backendBaseUrl = getBackendBaseUrl();
  const baseUrl = backendBaseUrl || '';
  return `${baseUrl}/api/agent/file?path=${encodeURIComponent(rawUrl)}`;
};

const getFileTypeColor = (fileType?: string) => {
  switch ((fileType || '').toUpperCase()) {
    case 'PDF':
      return 'text-rose-500 bg-rose-500/10 border-rose-200/20';
    case 'DOCX':
    case 'DOC':
      return 'text-blue-500 bg-blue-500/10 border-blue-200/20';
    case 'XLSX':
    case 'XLS':
    case 'CSV':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-200/20';
    case 'PPTX':
    case 'PPT':
      return 'text-orange-500 bg-orange-500/10 border-orange-200/20';
    case 'ZIP':
    case 'RAR':
    case '7Z':
    case 'TAR':
    case 'GZ':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-200/20';
    case 'TXT':
    case 'MD':
    case 'JSON':
    case 'XML':
    case 'YAML':
    case 'YML':
      return 'text-slate-500 bg-slate-500/10 border-slate-200/20';
    default:
      return 'text-muted-foreground bg-muted/50 border-muted/20';
  }
};

const getFileIcon = (fileType?: string) => {
  const type = (fileType || '').toUpperCase();
  const className = "h-5 w-5";
  
  switch (type) {
    case 'PDF':
    case 'DOCX':
    case 'DOC':
    case 'TXT':
    case 'MD':
      return <FileText className={className} />;
    case 'XLSX':
    case 'XLS':
    case 'CSV':
      return <FileSpreadsheet className={className} />;
    default:
      return <File className={className} />;
  }
};

const getFileLabel = (artifact: ChatArtifact): string => {
  const raw = artifact.content.filename || artifact.content.fileUrl || '';
  if (!raw) {
    return 'Untitled file';
  }

  const normalized = raw.replace(/\\/g, '/');
  const base = normalized.split('/').filter(Boolean).pop() || raw;
  return base;
};

const FileArtifactCard = ({ artifact }: { artifact: ChatArtifact }) => {
  const [isCopied, setIsCopied] = useState(false);
  const href = getFileHref(artifact);
  const label = getFileLabel(artifact);
  const fileType = artifact.content.fileType || 'file';
  const filePath = artifact.content.filename || artifact.content.fileUrl || '';
  const colorClass = getFileTypeColor(fileType);

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const path = artifact.content.fileUrl || artifact.content.filename;
    if (path) {
      try {
        await navigator.clipboard.writeText(path);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy path:', err);
      }
    }
  };

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border bg-card/50 p-3 hover:bg-card/80 transition-all hover:shadow-sm">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border", colorClass)}>
        {getFileIcon(fileType)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground" title={label}>
            {label}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase font-medium">{fileType}</span>
          {filePath && (
            <span className="truncate opacity-60 max-w-[220px]" title={filePath}>
              • {filePath}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleCopyPath}
          title={isCopied ? "Copied!" : "Copy path"}
        >
          {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        
        {href && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            asChild
          >
            <a href={href} target="_blank" rel="noreferrer" title="Open file">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

const renderArtifacts = (artifacts: ChatArtifact[]) => {
  const hasImages = artifacts.some((artifact) => artifact.type === 'IMAGE');
  const hasFiles = artifacts.some((artifact) => artifact.type === 'FILE');

  return (
    <div className="space-y-3 w-full">
      {hasImages && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {artifacts
            .filter((artifact) => artifact.type === 'IMAGE')
            .map((artifact) => {
              const src = getImageUrl(artifact);
              if (!src) {
                return null;
              }

              return (
                <a
                  key={artifact.id}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-xl border bg-background"
                >
                  <img
                    src={src}
                    alt="Generated artifact"
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </a>
              );
            })}
        </div>
      )}

      {hasFiles && (
        <div className="grid grid-cols-1 gap-3">
          {artifacts
            .filter((artifact) => artifact.type === 'FILE')
            .map((artifact) => (
              <FileArtifactCard key={artifact.id} artifact={artifact} />
            ))}
        </div>
      )}
    </div>
  );
};

const hasMessageContent = (message: ChatMessage): boolean => {
  return !!(
    message.content ||
    (Array.isArray(message.artifact) && message.artifact.length > 0) ||
    message.type === 'thinking' ||
    message.type === 'tool' ||
    message.error
  );
};

export function MessageList({ messages }: MessageListProps) {
  const [expandedToolResults, setExpandedToolResults] = useState<Set<string>>(new Set());

  const toggleToolResult = (id: string) => {
    setExpandedToolResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {messages.map((message) => {
        if (!hasMessageContent(message)) {
          return null;
        }

        const isUserMessage = message.type === 'user';

        return (
          <div
            key={message.id}
            className={cn(
              'flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500',
              isUserMessage ? 'justify-end' : 'justify-start'
            )}
          >
            <div className={cn("flex max-w-[95%] md:max-w-[85%]", isUserMessage ? "justify-end" : "justify-start")}>
              <div className={cn("flex flex-col gap-2 min-w-0 w-full", isUserMessage ? "items-end" : "items-start")}>
                
                <div 
                  className={cn(
                    "relative text-base leading-relaxed break-words",
                    isUserMessage 
                      ? "bg-secondary/80 text-secondary-foreground px-5 py-3 rounded-3xl rounded-tr-sm" 
                      : "text-foreground px-1 py-0 w-full"
                  )}
                >
                  {message.error ? (
                    <div className="w-full rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex items-center justify-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{message.error}</span>
                    </div>
                  ) : isUserMessage ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : Array.isArray(message.artifact) && message.artifact.length > 0 ? (
                    renderArtifacts(message.artifact)
                  ) : (
                    <div className="space-y-4 w-full">
                      {message.type === 'thinking' && (
                        <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30 border border-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Bot className="h-4 w-4 animate-pulse" />
                            <span className="text-xs font-medium uppercase tracking-wider">Thinking</span>
                          </div>
                          {message.content && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6 border-l-2 border-muted/50">
                              {message.content}
                            </p>
                          )}
                        </div>
                      )}

                      {message.type === 'tool' && (
                        <div className="rounded-lg border bg-card/50 overflow-hidden max-w-2xl">
                          <button
                            onClick={() => toggleToolResult(message.id)}
                            className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 transition-colors text-left"
                          >
                            {expandedToolResults.has(message.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Badge variant="secondary" className="font-mono text-xs font-normal bg-muted/50 text-muted-foreground">
                              {message.toolName}
                            </Badge>
                          </button>
                          
                          {expandedToolResults.has(message.id) && (
                            <div className="border-t bg-muted/10 p-3 font-mono text-xs overflow-x-auto">
                              {message.progress && (
                                <div className="mb-2 text-muted-foreground italic">{String(message.progress)}</div>
                              )}
                              {!!message.toolResult && (
                                <pre className="text-muted-foreground/80">
                                  {JSON.stringify(message.toolResult, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {(message.type === 'ai' || message.content) && message.type !== 'thinking' && message.type !== 'tool' && (
                         <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground leading-7 text-[15px] md:text-base">
                           <p className="whitespace-pre-wrap">{message.content || "..."}</p>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
}
