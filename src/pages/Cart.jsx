import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import { formatINR } from '../utils/format'
import toast from 'react-hot-toast'

export default function Cart() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart', { headers: { Authorization: `Bearer ${token}` } })
      setItems(res.data)
    } catch (err) {
      console.error('Cart fetch error:', err)
      toast.error(err?.response?.data?.message || 'Failed to load cart')
      setItems([])
    }
  }

  useEffect(() => {
    if (token) {
      fetchCart().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/${productId}`, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Item removed')
      fetchCart()
    } catch (err) {
      toast.error('Failed to remove item')
    }
  }

  const changeQty = async (productId, qty) => {
    try {
      await api.put(`/cart/${productId}`, { qty }, { headers: { Authorization: `Bearer ${token}` } })
      fetchCart()
    } catch (err) {
      toast.error('Failed to update quantity')
    }
  }

  if (loading) return <p className="text-gray-600">Loading...</p>

  const total = items.reduce((sum, i) => sum + i.qty * (i.product?.price || 0), 0)

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 card">
        <div className="card-body">
          <h2 className="text-xl font-semibold mb-2">Your Cart</h2>
          {items.length === 0 ? (
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            <div className="divide-y">
              {items.map((i) => (
                <div key={i.product?._id} className="flex items-center gap-4 py-4">
                  <div className="w-24 h-20 bg-gray-100 rounded overflow-hidden">
                    {i.product?.image && (
                      <img src={i.product.image} alt={i.product.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{i.product?.name}</div>
                    <div className="text-sm text-gray-600">{formatINR(i.product?.price || 0)}</div>
                  </div>
                  <div className="flex items-center">
                    <button className="btn btn-outline px-2" onClick={() => changeQty(i.product._id, Math.max(1, i.qty - 1))}>-</button>
                    <span className="px-3">{i.qty}</span>
                    <button className="btn btn-outline px-2" onClick={() => changeQty(i.product._id, i.qty + 1)}>+</button>
                  </div>
                  <button className="btn btn-outline" onClick={() => removeItem(i.product._id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <aside className="card h-max">
        <div className="card-body space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{formatINR(total)}</span>
          </div>
          <button className="btn btn-primary w-full" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </button>
        </div>
      </aside>
    </div>
  )
}
