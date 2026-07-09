import { test, expect } from '@playwright/test'

test.describe('판매자 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 판매자로 로그인
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'vendor@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('판매자 대시보드 조회', async ({ page }) => {
    await page.goto('/vendor/dashboard')
    
    await expect(page.locator('h1')).toContainText('판매자 대시보드')
    await expect(page.locator('text=총 매출')).toBeVisible()
    await expect(page.locator('text=총 주문')).toBeVisible()
  })

  test('판매자 상품 목록 조회', async ({ page }) => {
    await page.goto('/vendor/products')
    
    await expect(page.locator('h1')).toContainText('상품 관리')
  })

  test('판매자 주문 목록 조회', async ({ page }) => {
    await page.goto('/vendor/orders')
    
    await expect(page.locator('h1')).toContainText('주문 관리')
  })

  test('배송 처리', async ({ page }) => {
    await page.goto('/vendor/orders')
    
    // 배송 대기 중인 주문 찾기
    const pendingOrder = page.locator('text=배송 대기').first()
    
    if (await pendingOrder.isVisible()) {
      await page.click('text=배송 처리')
      
      // 송장 번호 입력
      await page.fill('input[name="trackingNumber"]', 'TEST123456')
      await page.click('button[type="submit"]')
      
      // 배송 완료 메시지 확인
      await expect(page.locator('text=배송이 처리되었습니다')).toBeVisible()
    }
  })
})
