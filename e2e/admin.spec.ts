import { test, expect } from '@playwright/test'

test.describe('관리자 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자로 로그인
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('관리자 대시보드 조회', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    await expect(page.locator('h1')).toContainText('관리자 대시보드')
    await expect(page.locator('text=총 사용자')).toBeVisible()
    await expect(page.locator('text=총 벤더')).toBeVisible()
    await expect(page.locator('text=총 상품')).toBeVisible()
    await expect(page.locator('text=총 주문')).toBeVisible()
  })

  test('벤더 목록 조회', async ({ page }) => {
    await page.goto('/admin/vendors')
    
    await expect(page.locator('h1')).toContainText('벤더 관리')
  })

  test('벤더 승인', async ({ page }) => {
    await page.goto('/admin/vendors')
    
    // 승인 대기 중인 벤더 찾기
    const pendingVendor = page.locator('text=승인 대기').first()
    
    if (await pendingVendor.isVisible()) {
      await page.click('text=승인')
      
      // 확인 대화상장에서 확인
      await page.click('text=확인')
      
      // 승인 완료 메시지 확인
      await expect(page.locator('text=벤더가 승인되었습니다')).toBeVisible()
    }
  })

  test('분석 데이터 조회', async ({ page }) => {
    await page.goto('/admin/analytics')
    
    await expect(page.locator('h1')).toContainText('분석 및 리포트')
    await expect(page.locator('text=매출')).toBeVisible()
    await expect(page.locator('text=주문')).toBeVisible()
  })
})
