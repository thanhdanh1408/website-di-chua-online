import { chromium } from 'playwright'
import { existsSync } from 'node:fs'

const candidates = [
  process.env.PLAYWRIGHT_CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)
const executablePath = candidates.find(existsSync)
if (!executablePath) throw new Error('Không tìm thấy Chrome/Edge. Có thể đặt PLAYWRIGHT_CHROME_PATH.')

const baseURL = process.env.FIREBASE_AUTH_TEST_URL || 'http://localhost:4175'
const browser = await chromium.launch({ executablePath, headless: true })
const context = await browser.newContext()
const page = await context.newPage()
try {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  if (await page.getByRole('link', { name: 'Quản trị', exact: true }).count()) throw new Error('Khách hoặc người dùng thường vẫn nhìn thấy liên kết Quản trị.')
  await page.goto(`${baseURL}/admin`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Khu vực quản trị' }).waitFor({ state: 'visible' })
  if (!await page.getByRole('link', { name: 'Đăng nhập bằng Google' }).isVisible()) throw new Error('Trang quản trị chưa khóa đúng khi chưa có quyền admin.')
  await page.goto(`${baseURL}/tai-khoan`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Tiếp tục với Google/ }).waitFor({ state: 'visible' })
  const configError = await page.locator('.firebase-error').textContent().catch(() => null)
  if (configError) throw new Error(configError)
  const popupPromise = page.waitForEvent('popup', { timeout: 15_000 })
  await page.getByRole('button', { name: /Tiếp tục với Google/ }).click()
  const popup = await popupPromise
  await popup.waitForURL(url => ['accounts.google.com', 'accounts.youtube.com'].includes(url.hostname), { timeout: 20_000 })
  console.log('Auth đạt: trang admin đang khóa và Firebase đã mở đăng nhập Google; không thực hiện đăng nhập tự động.')
  await popup.close()
} finally {
  await browser.close()
}
