import { test, expect } from '@playwright/test'

test.describe('장바구니 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('장바구니 조회', async ({ page }) => {
    await page.goto('/customer/cart')
    
    await expect(page.locator('h1')).toContainText('장바구니')
  })

  test('장바구니 수량 수정', async ({ page }) => {
    await page.goto('/customer/cart')
    
    // 수량 증가 버튼 클릭
    await page.click('button[aria-label="수량 증가"]')
    
    // 수량이 변경되었는지 확인
    await expect(page.locator('text=수량: 2')).toBeVisible()
  })

  test('장바구니에서 상품 삭제', async ({ page }) => {
    await page.goto('/customer/cart')
    
    // 삭제 버튼 클릭
    await page.click('button[aria-label="삭제"]')
    
    // 확인 대화상장에서 확인
    await page.click('text=확인')
    
    // 상품이 삭제되었는지 확인
    await expect(page.locator('text=장바구니가 비어있습니다')).toBeVisible()
  })
})
