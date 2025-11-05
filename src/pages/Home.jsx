import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import ProductCard from '../components/ProductCard'
import toast from 'react-hot-toast'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/products')
        setProducts(res.data)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const addToCart = async (productId) => {
    if (!token) return toast.error('Please sign in to add to cart')
    try {
      await api.post('/cart/add', { productId, qty: 1 }, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Added to cart')
    } catch (err) {
      console.error('Add to cart error:', err)
      toast.error(err?.response?.data?.message || 'Failed to add to cart')
    }
  }

  if (loading) return <p className="text-gray-600">Loading...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="space-y-6">
      <section className="bg-emerald-600 rounded-2xl text-white p-8 flex items-center">
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-4xl font-bold">Fresh. Organic. Delivered.</h1>
          <p className="mt-2 text-emerald-100">Shop eco-friendly groceries and essentials at the best prices.</p>
          <a href="#products" className="btn btn-outline mt-4 bg-white/10 border-white text-white hover:bg-white/20">Shop now</a>
        </div>
      </section>

      <section id="products">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Popular products</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map(p => (
            <ProductCard key={p._id} product={p} onAdd={addToCart} />
          ))}
        </div>
      </section>
    </div>
  )
}
