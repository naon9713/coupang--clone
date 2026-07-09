import { test, expect } from '@playwright/test'

test.describe('상품 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('상품 목록 조회', async ({ page }) => {
    await page.goto('/products')
    
    await expect(page.locator('h1')).toContainText('상품 목록')
    await expect(page.locator('.grid')).toBeVisible()
  })

  test('상품 상세 조회', async ({ page }) => {
    await page.goto('/products')
    
    // 첫 번째 상품 클릭
    await page.click('text=상세 보기')
    
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=판매자')).toBeVisible()
  })

  test('장바구니에 상품 추가', async ({ page }) => {
    await page.goto('/products')
    
    // 첫 번째 상품의 장바구니 버튼 클릭
    await page.click('text=장바구니 담기')
    
    // 성공 메시지 확인
    await expect(page.locator('text=장바구니에 추가되었습니다')).toBeVisible()
  })
})
