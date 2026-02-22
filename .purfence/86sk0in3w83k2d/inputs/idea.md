# Idea

## 需求描述（原文）

**标题**：添加自动更新检查和重启功能

## 功能需求

### 背景
用户需要应用能够自动检查更新，并在确认后自动下载和重启。

### 核心功能

#### 1. 定时检查更新
- **频率**：每 2 小时检查一次
- **更新源**：GitHub Releases API
- **项目**：公开项目（无需认证）
- **API**: `https://api.github.com/repos/lzj960515/purfence/releases/latest`

#### 2. 发现新版本
- 在界面上显示**"有新版本"按钮**（badge 形式）
- 点击按钮后弹窗显示：
  - 当前版本
  - 最新版本
  - 更新内容（Release Notes）
  - "更新"和"取消"按钮

#### 3. 下载更新
- 用户点击"更新"按钮后开始下载
- 显示下载进度条
- 支持取消下载

#### 4. 重启应用
- 下载完成后弹窗提示：
  - "更新下载完成，是否立即重启应用？"
  - "重启"和"稍后"按钮
- 用户点击"重启"后：
  - 自动关闭当前应用
  - macOS: 挂载 dmg，复制新版本到 Applications
  - Windows: 运行 msi/exe 安装包
  - 重启应用

### 平台支持
- ✅ macOS (dmg)
- ✅ Windows (msi/exe)

---

## 实现要点

### 1. 后端 - 更新检查服务

```typescript
// src/main/services/update.service.ts

@Injectable()
export class UpdateService {
  private checkInterval: NodeJS.Timer;
  private readonly CHECK_INTERVAL = 2 * 60 * 60 * 1000; // 2小时

  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      const response = await fetch(
        'https://api.github.com/repos/lzj960515/purfence/releases/latest'
      );
      const release = await response.json();
      
      const latestVersion = release.tag_name.replace('v', '');
      const currentVersion = app.getVersion();
      
      if (this.compareVersions(latestVersion, currentVersion) > 0) {
        return {
          version: latestVersion,
          releaseNotes: release.body,
          downloadUrl: this.getDownloadUrl(release.assets),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Check update failed:', error);
      return null;
    }
  }

  startPeriodicCheck() {
    this.checkInterval = setInterval(async () => {
      const update = await this.checkForUpdates();
      if (update) {
        this.notifyUpdate(update);
      }
    }, this.CHECK_INTERVAL);
  }
}
```

### 2. 前端 - UI 组件

```typescript
// 更新按钮组件
<UpdateButton>
  {hasUpdate && (
    <Badge color="red">
      <BellIcon /> 有新版本
    </Badge>
  )}
</UpdateButton>

// 更新弹窗
<UpdateDialog>
  <VersionInfo>
    当前版本: {currentVersion}
    最新版本: {latestVersion}
  </VersionInfo>
  
  <ReleaseNotes>
    {releaseNotes}
  </ReleaseNotes>
  
  <Actions>
    <Button onClick={onUpdate}>更新</Button>
    <Button onClick={onCancel}>取消</Button>
  </Actions>
</UpdateDialog>

// 下载进度
<DownloadProgress>
  <ProgressBar value={progress} />
  <Text>{downloaded}MB / {total}MB</Text>
  <Button onClick={onCancel}>取消</Button>
</DownloadProgress>

// 重启确认
<RestartDialog>
  <Text>更新下载完成，是否立即重启应用？</Text>
  <Actions>
    <Button onClick={onRestart}>重启</Button>
    <Button onClick={onLater}>稍后</Button>
  </Actions>
</RestartDialog>
```

### 3. 下载和安装

```typescript
async downloadUpdate(downloadUrl: string): Promise<string> {
  const downloadPath = path.join(app.getPath('temp'), 'purfence-update');
  
  // 下载文件
  const response = await fetch(downloadUrl);
  const fileStream = fs.createWriteStream(downloadPath);
  
  // 显示进度
  await streamWithProgress(response.body, fileStream, (progress) => {
    this.sendProgress(progress);
  });
  
  return downloadPath;
}

async installAndRestart(updateFile: string) {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS: 挂载 dmg 并复制
    exec(`hdiutil attach "${updateFile}"`);
    exec(`cp -R "/Volumes/Purfence/Purfence.app" "/Applications/"`);
    exec(`hdiutil detach "/Volumes/Purfence"`);
  } else if (platform === 'win32') {
    // Windows: 运行安装包
    exec(`start "" "${updateFile}"`);
  }
  
  // 重启应用
  app.relaunch();
  app.exit(0);
}
```

### 4. IPC 通信

```typescript
// Main process
ipcMain.handle('check-update', async () => {
  return await updateService.checkForUpdates();
});

ipcMain.handle('download-update', async (event, url) => {
  return await updateService.downloadUpdate(url);
});

ipcMain.handle('install-and-restart', async (event, file) => {
  return await updateService.installAndRestart(file);
});

// Renderer process
const checkUpdate = () => ipcRenderer.invoke('check-update');
const downloadUpdate = (url) => ipcRenderer.invoke('download-update', url);
const installAndRestart = (file) => ipcRenderer.invoke('install-and-restart', file);
```

---

## 用户流程

```
应用启动
  ↓
开始定时检查（每2小时）
  ↓
发现新版本 → 显示"有新版本"按钮
  ↓
用户点击按钮 → 弹窗显示版本信息
  ↓
用户点击"更新" → 开始下载
  ↓
显示下载进度
  ↓
下载完成 → 弹窗提示重启
  ↓
用户点击"重启" → 安装更新并重启应用
```

---

## 技术要点

### 1. 版本比较
```typescript
compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  
  return 0;
}
```

### 2. 下载 URL 选择
```typescript
getDownloadUrl(assets: any[]): string {
  const platform = process.platform;
  const arch = process.arch;
  
  if (platform === 'darwin' && arch === 'arm64') {
    return assets.find(a => a.name.includes('aarch64.dmg'))?.browser_download_url;
  } else if (platform === 'win32') {
    return assets.find(a => a.name.includes('.msi') || a.name.includes('.exe'))?.browser_download_url;
  }
}
```

### 3. 进度显示
```typescript
streamWithProgress(stream, fileStream, onProgress) {
  let downloaded = 0;
  const total = parseInt(stream.headers['content-length'], 10);
  
  stream.on('data', (chunk) => {
    downloaded += chunk.length;
    onProgress({
      downloaded,
      total,
      percentage: (downloaded / total) * 100,
    });
  });
}
```

---

## 涉及的文件

### 后端
- `src/main/services/update.service.ts` - 更新检查服务
- `src/main/controllers/update.controller.ts` - IPC 处理
- `src/main/utils/version.ts` - 版本比较工具

### 前端
- `src/renderer/components/UpdateButton.tsx` - 更新按钮
- `src/renderer/components/UpdateDialog.tsx` - 更新弹窗
- `src/renderer/components/DownloadProgress.tsx` - 下载进度
- `src/renderer/hooks/useUpdate.ts` - 更新逻辑 hook

---

## 验收标准

- ✅ 每 2 小时自动检查更新
- ✅ 发现新版本时显示"有新版本"按钮
- ✅ 点击按钮弹窗显示版本信息和更新内容
- ✅ 用户确认后开始下载，显示进度
- ✅ 下载完成后弹窗提示重启
- ✅ 用户确认后自动安装并重启
- ✅ 支持 macOS 和 Windows
- ✅ 可以取消下载
- ✅ 可以选择"稍后"重启
- ✅ 错误处理完善（网络错误、下载失败等）

---

## 优先级

**P1（中优先级）** - 提升用户体验

---

## 注意事项

1. **权限问题**：
   - macOS: 需要管理员权限复制到 /Applications
   - Windows: 可能需要 UAC 提权

2. **错误处理**：
   - 网络错误重试
   - 下载失败清理临时文件
   - 安装失败回滚

3. **安全考虑**：
   - 验证下载文件的签名
   - HTTPS 下载
   - 防止中间人攻击

4. **用户体验**：
   - 不要在用户工作时强制重启
   - 提供足够的提示和选择
   - 清晰的进度反馈
