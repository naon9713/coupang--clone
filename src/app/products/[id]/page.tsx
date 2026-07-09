import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          rating: true,
          reviewCount: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: true,
    },
  })

  return product
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id)
  const session = await auth()

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>상품을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 이미지 섹션 */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 2}`}
                    className="w-full h-full object-cover hover:opacity-75"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 섹션 */}
        <div className="space-y-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">
              {product.category.name}
            </div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">⭐</span>
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
                <span className="text-gray-500">({product.reviewCount}개 리뷰)</span>
              </div>
              <div className="text-gray-500">
                조회수 {product.viewCount}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              {product.salePrice ? (
                <>
                  <span className="text-3xl font-bold text-red-600">
                    ₩{product.salePrice.toLocaleString()}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    ₩{product.basePrice.toLocaleString()}
                  </span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                    {Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                    할인
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold">
                  ₩{product.basePrice.toLocaleString()}
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              재고: {product.stock}개
            </div>
          </div>

          {/* 판매자 정보 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">판매자</div>
                  <div className="font-semibold">{product.vendor.businessName}</div>
                  <div className="text-sm text-gray-600">
                    ⭐ {product.vendor.rating.toFixed(1)} ({product.vendor.reviewCount}개 리뷰)
                  </div>
                </div>
                <Button variant="outline">채팅하기</Button>
              </div>
            </CardContent>
          </Card>

          {/* 상품 설명 */}
          {product.description && (
            <div>
              <h2 className="text-xl font-semibold mb-3">상품 설명</h2>
              <div className="prose max-w-none text-gray-700">
                {product.description}
              </div>
            </div>
          )}

          {/* 구매 버튼 */}
          <div className="flex gap-4">
            <Button size="lg" className="flex-1" disabled={!session}>
              장바구니 담기
            </Button>
            <Button size="lg" className="flex-1" variant="outline" disabled={!session}>
              찜하기
            </Button>
          </div>

          {!session && (
            <p className="text-sm text-gray-500 text-center">
              구매하려면 로그인이 필요합니다.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
