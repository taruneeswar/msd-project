import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import { formatINR } from '../utils/format'
import toast from 'react-hot-toast'

export default function Orders() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/payment/orders', { headers: { Authorization: `Bearer ${token}` } })
      setOrders(res.data)
    } catch (err) {
      toast.error('Failed to load orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) return <p className="text-gray-600">Loading orders...</p>

  if (orders.length === 0) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="card-body text-center">
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-4">Start shopping to create your first order</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Start Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-600">
                    Order ID: <span className="font-mono">{order._id}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Date: {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.paymentStatus)}
                  <div className="font-semibold text-lg mt-1">{formatINR(order.totalAmount)}</div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.product?.image && (
                        <img
                          src={item.product.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        {formatINR(item.price)} × {item.qty}
                      </div>
                    </div>
                    <div className="font-semibold">{formatINR(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              {order.deliveryAddress && (
                <div className="border-t pt-3 mt-3 text-sm">
                  <div className="font-medium text-gray-700">Delivery Address:</div>
                  <div className="text-gray-600">{order.deliveryAddress}</div>
                  {order.deliveryPhone && (
                    <div className="text-gray-600">Phone: {order.deliveryPhone}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
