import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus } from 'lucide-react'
import { Rating } from '../common/Rating'
import { formatPrice } from '@/utils/format'

interface Product {
  id: string | number
  name: string
  images?: string[]
  description?: string
  rating?: number
  price: number
  compareAtPrice?: number
  variants?: { attributes: Record<string, string> }[]
  thumbnail?: string
}

interface ProductDetailPopupProps {
  product: Product
  onClose: () => void
}

const ProductDetailPopup: React.FC<ProductDetailPopupProps> = ({ product, onClose }) => {
  const [selectAttrs, setSelectAttrs] = useState<Record<string, string>>({})
  const [qty, setQty] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)

  const originalPrice  = product.compareAtPrice

  const handleSelectAttrs = (attrname: string, value: string) => {
    setSelectAttrs(prev => ({ ...prev, [attrname]: value }))
    setError(null)
  }

  const handleDecrease = () => {
    if (qty > 1) {
      setQty(qty - 1)
      setError(null)
    } else {
      setError('Quantity cannot be less than 1')
    }
  }

  const handleIncrease = () => {
    setQty(qty + 1)
    setError(null)
  }

  const handleAddToCart = () => {
    // Stub: Integrate with cart logic later
    console.log('Adding to cart:', { productId: product.id, attributes: selectAttrs, quantity: qty })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center py-3 px-4 border-b">
          <h3 className="text-2xl font-bold text-gray-800">{product.name}</h3>
          <button
            onClick={onClose}
            className="size-8 flex justify-center items-center rounded-full bg-gray-100 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-96">
          <img src={product.thumbnail} alt={product.name} className="w-60 h-60 object-cover mb-4 rounded" />
          <p className="text-gray-700 mb-2">{product.description}</p>
          <div>
            <Rating value={product.rating || 0} />
          </div>
          {product.price && product.price > 0 ? (
            <>
                <div className="mt-4 flex items-center justify-between gap-4 mb-1">
                  <p className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-white">
                    {formatPrice(product.price > 0 ? product.price : product.compareAtPrice || 0)}
                  </p>
                </div>
                <div className=" flex items-center justify-between">
                  {product.compareAtPrice && product.price > 0 && product.compareAtPrice > product.price && (
                    <span className="text-base text-neutral-400 dark:text-neutral-500 line-through font-medium">
                     {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
              {(() => {
                const variants = product.variants;
                if (!variants || variants.length === 0 || !variants[0]?.attributes) return null;
                return Object.keys(variants[0].attributes).map((attrname) => {
                  const value = [...new Set(variants.map((v) => v.attributes?.[attrname]).filter(Boolean))]
                  return (
                    <div key={attrname}>
                      <p className="text-foreground font-medium mb-6">
                        {attrname} :
                      </p>
                      <div className="flex space-x-2 mb-6">
                        {value.map((item) => (
                          <button
                            key={item}
                            onClick={() => handleSelectAttrs(attrname, item)}
                            className={`px-4 py-2 border border-md transition-colors mb-5
                              ${selectAttrs[attrname] === item ? "bg-blue-500 text-white border-blue-500" : "bg-background text-foreground border-border"}
                              hover:border-gray-500 `}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                      {error && <p className="text-red-500">{error}</p>}
                    </div>
                  )
                })
              })()}
            </>
          ) : (
            <>
              <p className="text-lg font-bold">
                {formatPrice(originalPrice)}
              </p>
            </>
          )}
          <div>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center border border-border rounded-md">
                <button
                  className="p-2 hover:bg-muted transition-colors"
                  onClick={handleDecrease}
                >
                  <Minus className="h-4 w-4" />
                </button>

                <button className="px-4 py-2 border border-border rounded-md transition-colors text-foreground">
                  {qty}
                </button>
                <button
                  className="p-2 hover:bg-muted transition-colors"
                  onClick={handleIncrease}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t">
          <Link to={`/products/${product.id}`}>
            <button className="py-2 px-3 rounded-lg border bg-white hover:bg-gray-50">
              View
            </button>
          </Link>
          <button
            onClick={handleAddToCart}
            className="py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPopup
