import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'

const candidates = [
  process.env.PLAYWRIGHT_CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)
const executablePath = candidates.find(existsSync)
if (!executablePath) throw new Error('Không tìm thấy Chrome/Edge. Có thể đặt PLAYWRIGHT_CHROME_PATH.')

const baseURL = process.env.MOBILE_TEST_URL || 'http://127.0.0.1:4175'
const routes = ['/', '/chua/an-nhien', '/xin-xam', '/to-nguyen', '/cong-duc', '/lich', '/thien', '/tai-khoan', '/gioi-thieu', '/admin']
const viewports = [{ name: 'small', width: 360, height: 800 }, { name: 'iphone', width: 390, height: 844 }, { name: 'large', width: 430, height: 932 }]
const browser = await chromium.launch({ executablePath, headless: true })
const failures = []
mkdirSync('mobile-artifacts', { recursive: true })

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  const consoleErrors = []
  const failedResources = []
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Failed to load resource')) consoleErrors.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) failedResources.push(`${response.status()} ${response.url()}`) })
  for (const route of routes) {
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' })
    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
    }))
    if (layout.documentWidth > layout.viewportWidth + 1 || layout.bodyWidth > layout.viewportWidth + 1) {
      failures.push(`${viewport.name} ${route}: tràn ngang ${Math.max(layout.documentWidth, layout.bodyWidth)}px > ${layout.viewportWidth}px`)
    }
    if (viewport.name === 'iphone' && ['/', '/chua/an-nhien', '/tai-khoan', '/lich'].includes(route)) {
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y < height; y += 600) { await page.evaluate(value => window.scrollTo(0, value), y); await page.waitForTimeout(30) }
      await page.evaluate(() => window.scrollTo(0, 0))
      const filename = route === '/' ? 'home' : route.split('/').filter(Boolean).join('-')
      await page.screenshot({ path: `mobile-artifacts/${filename}-${viewport.width}.png`, fullPage: true })
    }
  }
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.locator('.menu-button').click()
  if (!await page.locator('.main-nav').evaluate(element => element.classList.contains('open'))) failures.push(`${viewport.name}: menu mobile không mở`)
  if (await page.locator('.main-nav a').count() !== 6) failures.push(`${viewport.name}: menu mobile thiếu liên kết`)
  if (consoleErrors.length) failures.push(...consoleErrors.map(error => `${viewport.name}: console ${error}`))
  if (failedResources.length) failures.push(...[...new Set(failedResources)].map(error => `${viewport.name}: resource ${error}`))
  await context.close()
}
await browser.close()
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else console.log(`Mobile QA đạt: ${routes.length} trang × ${viewports.length} viewport, không tràn ngang và không có console error.`)
