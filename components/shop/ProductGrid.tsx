import Image from 'next/image'
import { getShopProducts } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/client'
import AddToCartButton from './AddToCartButton'

interface Props {
  shopSlug: string
  shopName: string
}

export default async function ProductGrid({ shopSlug, shopName }: Props) {
  const products = await getShopProducts(shopSlug)
  if (!products.length) return null

  const grouped: Record<string, typeof products> = {}
  for (const p of products) {
    if (!grouped[p.category]) grouped[p.category] = []
    grouped[p.category].push(p)
  }

  return (
    <section className="space-y-6">
      <h2
        className="text-sm font-semibold"
        style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}
      >
        Order from this shop
      </h2>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p
            className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: 'var(--bark)' }}
          >
            {category}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map(product => {
              const imgUrl = product.images?.[0]
                ? urlFor(product.images[0]).width(300).height(200).fit('crop').url()
                : null

              return (
                <div
                  key={product._id}
                  className="flex flex-col rounded-xl overflow-hidden"
                  style={{ background: '#fff', border: '1px solid var(--sand)' }}
                >
                  {imgUrl && (
                    <div className="relative h-32 bg-gray-100">
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5 p-3 flex-1">
                    <p
                      className="text-xs font-semibold leading-tight"
                      style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}
                    >
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--bark)' }}>
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-baseline justify-between mt-auto pt-1">
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}
                      >
                        £{product.price.toFixed(2)}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--bark)' }}>
                        {product.unit}
                      </span>
                    </div>
                    <AddToCartButton
                      id={product._id}
                      shopSlug={shopSlug}
                      shopName={shopName}
                      name={product.name}
                      price={product.price}
                      unit={product.unit}
                      image={imgUrl ?? undefined}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}
