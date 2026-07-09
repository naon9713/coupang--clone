import { test, expect } from '@playwright/test'

test.describe('인증 시스템 테스트', () => {
  test('회원가입', async ({ page }) => {
    await page.goto('/auth/signup')
    
    await page.fill('input[name="name"]', '테스트 사용자')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.selectOption('select[name="role"]', 'CUSTOMER')
    
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/auth/signin')
  })

  test('로그인', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/')
  })

  test('로그아웃', async ({ page }) => {
    // 먼저 로그인
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/')
    
    // 로그아웃
    await page.click('text=로그아웃')
    
    await expect(page).toHaveURL('/auth/signin')
  })
})
