import { formatINR } from '../utils/format'

export default function ProductCard({ product, onAdd }) {
  return (
    <div className="card group">
      <div className="aspect-[4/3] bg-gray-100 rounded-t-xl overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-400">No image</div>
        )}
      </div>
      <div className="card-body">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
          <span className="text-emerald-700 font-semibold">{formatINR(product.price)}</span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
        <button className="btn btn-primary w-full mt-3" onClick={() => onAdd(product._id)}>Add to cart</button>
      </div>
    </div>
  )
}
