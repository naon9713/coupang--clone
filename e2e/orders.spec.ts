import { test, expect } from '@playwright/test'

test.describe('주문 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('주문 목록 조회', async ({ page }) => {
    await page.goto('/customer/orders')
    
    await expect(page.locator('h1')).toContainText('주문 내역')
  })

  test('주문 상세 조회', async ({ page }) => {
    await page.goto('/customer/orders')
    
    // 첫 번째 주문 클릭
    await page.click('text=주문 상세')
    
    await expect(page.locator('text=주문 번호')).toBeVisible()
    await expect(page.locator('text=배송 상태')).toBeVisible()
  })

  test('주문 취소', async ({ page }) => {
    await page.goto('/customer/orders')
    
    // 취소 가능한 주문 찾기
    const cancelableOrder = page.locator('text=주문 취소').first()
    
    if (await cancelableOrder.isVisible()) {
      await cancelableOrder.click()
      
      // 확인 대화상장에서 확인
      await page.click('text=확인')
      
      // 취소 완료 메시지 확인
      await expect(page.locator('text=주문이 취소되었습니다')).toBeVisible()
    }
  })
})
