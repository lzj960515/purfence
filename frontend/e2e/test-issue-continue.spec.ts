import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/Users/liaozijian/Documents/purfence/purfence/worktrees/add-continue-execution-and-chat/test-screenshots';

test.describe('Issue 继续运行功能前端测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置较长的超时时间
    test.setTimeout(90000);
  });

  test('01 - 访问首页并检查加载', async ({ page }) => {
    console.log('测试步骤 1: 访问首页');

    // 访问首页
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 截图
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-homepage.png`,
      fullPage: true
    });

    // 检查页面是否正常加载（不是空白页）
    const bodyContent = await page.locator('body').innerHTML();
    expect(bodyContent.length).toBeGreaterThan(100);

    console.log('首页截图已保存');
  });

  test('02 - 访问项目列表页', async ({ page }) => {
    console.log('测试步骤 2: 访问项目列表');

    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-projects-page.png`,
      fullPage: true
    });

    // 检查是否有项目列表或空状态提示
    const pageContent = await page.locator('body').textContent();
    console.log('页面内容预览:', pageContent?.substring(0, 200));

    // 查找项目卡片或列表项
    const projectCards = await page.locator('[class*="card"], [class*="project"], [class*="list"] > div, tr').count();
    console.log(`找到 ${projectCards} 个可能的项目元素`);
  });

  test('03 - 进入项目详情页', async ({ page }) => {
    console.log('测试步骤 3: 进入项目详情页');

    // 访问项目列表
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 截图项目列表
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-projects-list.png`,
      fullPage: true
    });

    // 项目表格使用 TableRow 点击导航，不是链接
    // 查找表格中的行
    const tableRows = await page.locator('table tbody tr').all();
    console.log(`找到 ${tableRows.length} 个表格行`);

    if (tableRows.length > 0) {
      // 获取第一个项目的名称
      const firstRowName = await tableRows[0].locator('td').first().textContent();
      console.log(`第一个项目名称: ${firstRowName}`);

      // 点击第一行进入项目详情
      await tableRows[0].click();
      await page.waitForTimeout(3000);

      // 验证 URL 已跳转到项目详情
      const currentUrl = page.url();
      console.log(`当前 URL: ${currentUrl}`);
      expect(currentUrl).toMatch(/\/projects\/[^/]+$/);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-project-detail.png`,
        fullPage: true
      });

      // 获取项目详情页内容
      const detailContent = await page.locator('body').textContent();
      console.log('项目详情页内容预览:', detailContent?.substring(0, 300));
    } else {
      console.log('没有找到项目表格行');
    }
  });

  test('04 - 进入 Issue 详情页并检查执行历史', async ({ page }) => {
    console.log('测试步骤 4: 进入 Issue 详情页');

    // 访问项目列表
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 项目表格使用 TableRow 点击导航
    const projectRows = await page.locator('table tbody tr').all();
    console.log(`找到 ${projectRows.length} 个项目表格行`);

    // 遍历所有项目，找到有 Issue 的项目
    for (let i = 0; i < projectRows.length; i++) {
      console.log(`检查第 ${i + 1} 个项目`);

      // 重新获取项目列表（因为每次导航后页面会变化）
      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const currentProjectRows = await page.locator('table tbody tr').all();
      if (i >= currentProjectRows.length) break;

      // 点击项目进入详情
      await currentProjectRows[i].click();
      await page.waitForTimeout(3000);

      const projectUrl = page.url();
      console.log(`项目 URL: ${projectUrl}`);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-project-${i + 1}.png`,
        fullPage: true
      });

      // 检查是否有 Issue 表格
      const issueRows = await page.locator('table tbody tr').all();
      console.log(`找到 ${issueRows.length} 个 Issue 表格行`);

      if (issueRows.length > 0) {
        console.log(`在项目 ${i + 1} 中找到 ${issueRows.length} 个 Issue`);

        // 点击第一个 Issue 进入详情
        await issueRows[0].click();
        await page.waitForTimeout(3000);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/04-issue-detail.png`,
          fullPage: true
        });

        // 检查执行历史区域
        const executionHistoryTitle = await page.locator('h3:has-text("执行历史")').first();
        const hasExecutionHistory = await executionHistoryTitle.count() > 0;

        console.log(`执行历史区域存在: ${hasExecutionHistory}`);

        if (hasExecutionHistory) {
          console.log('找到执行历史区域');

          // 检查执行记录卡片
          const executionCards = await page.locator('[class*="card"]').all();
          console.log(`找到 ${executionCards.length} 个卡片元素`);

          // 检查状态标签
          const statusBadges = await page.locator('[class*="badge"]').all();
          console.log(`找到 ${statusBadges.length} 个状态标签`);

          // 检查"对话"按钮
          const chatButton = await page.locator('button:has-text("对话")').first();
          if (await chatButton.count() > 0) {
            console.log('找到"对话"按钮 - 这是继续运行功能的入口');
          }

          // 检查"开始处理"按钮
          const startButton = await page.locator('button:has-text("开始处理")').first();
          if (await startButton.count() > 0) {
            console.log('找到"开始处理"按钮');
          }
        }

        // 截图最终状态
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/04-issue-detail-final.png`,
          fullPage: true
        });

        // 找到有 Issue 的项目，退出循环
        return;
      } else {
        console.log(`项目 ${i + 1} 没有 Issue，继续检查下一个项目`);
      }
    }

    console.log('所有项目都没有 Issue');
  });

  test('05 - 测试执行历史的"对话"按钮功能', async ({ page }) => {
    console.log('测试步骤 5: 测试"对话"按钮');

    // 访问项目列表
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 项目表格使用 TableRow 点击导航
    const projectRows = await page.locator('table tbody tr').all();
    console.log(`找到 ${projectRows.length} 个项目表格行`);

    // 遍历所有项目，找到有 Issue 的项目
    for (let i = 0; i < projectRows.length; i++) {
      console.log(`检查第 ${i + 1} 个项目`);

      // 重新获取项目列表
      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const currentProjectRows = await page.locator('table tbody tr').all();
      if (i >= currentProjectRows.length) break;

      // 点击项目进入详情
      await currentProjectRows[i].click();
      await page.waitForTimeout(3000);

      // 检查是否有 Issue 表格
      const issueRows = await page.locator('table tbody tr').all();
      console.log(`找到 ${issueRows.length} 个 Issue 表格行`);

      if (issueRows.length > 0) {
        console.log(`在项目 ${i + 1} 中找到 ${issueRows.length} 个 Issue`);

        // 点击第一个 Issue 进入详情
        await issueRows[0].click();
        await page.waitForTimeout(3000);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/05-issue-detail.png`,
          fullPage: true
        });

        // 检查是否有执行历史
        const executionCards = await page.locator('[class*="card"]').filter({
          has: page.locator('code')
        }).all();

        console.log(`找到 ${executionCards.length} 个执行记录卡片`);

        if (executionCards.length > 0) {
          // 查找"对话"按钮
          const chatButton = await page.locator('button:has-text("对话")').first();

          if (await chatButton.count() > 0) {
            console.log('找到"对话"按钮，准备点击');

            // 截图点击前
            await page.screenshot({
              path: `${SCREENSHOT_DIR}/05-before-chat-click.png`
            });

            // 点击对话按钮
            await chatButton.click();
            await page.waitForTimeout(3000);

            // 检查是否跳转到 Agent 页面
            const currentUrl = page.url();
            console.log(`点击后 URL: ${currentUrl}`);

            // 验证 URL 包含预期的参数
            expect(currentUrl).toContain('/agent');
            expect(currentUrl).toContain('thread=');
            expect(currentUrl).toContain('executionId=');
            expect(currentUrl).toContain('issueId=');

            // 截图点击后
            await page.screenshot({
              path: `${SCREENSHOT_DIR}/05-after-chat-click.png`,
              fullPage: true
            });

            console.log('点击"对话"按钮后成功跳转到 Agent 页面');

            // 找到并测试成功，退出循环
            return;
          } else {
            console.log('没有找到"对话"按钮（可能是因为还没有执行记录）');
          }
        } else {
          console.log('没有找到执行记录，无法测试"对话"按钮');

          // 检查是否有"开始处理"按钮
          const startButton = await page.locator('button:has-text("开始处理")').first();
          if (await startButton.count() > 0) {
            console.log('找到"开始处理"按钮，可以开始处理 Issue');
          }
        }
      } else {
        console.log(`项目 ${i + 1} 没有 Issue，继续检查下一个项目`);
      }
    }

    console.log('没有找到有执行记录的 Issue 来测试"对话"按钮');
  });
});
