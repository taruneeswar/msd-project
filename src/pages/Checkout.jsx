import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import { formatINR } from '../utils/format'
import toast from 'react-hot-toast'

export default function Checkout() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '')
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '')

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart', { headers: { Authorization: `Bearer ${token}` } })
      setItems(res.data)
    } catch (err) {
      toast.error('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((sum, i) => sum + i.qty * (i.product?.price || 0), 0)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    if (!deliveryAddress || !deliveryPhone) {
      toast.error('Please enter delivery address and phone number')
      return
    }

    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setProcessing(true)

    try {
      // Check if Razorpay keys are configured
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID
      const isTestMode = !razorpayKeyId || razorpayKeyId === 'your_razorpay_key_id_here'

      if (isTestMode) {
        // TEST MODE: Simulate payment without Razorpay
        toast.loading('Processing test payment...')
        
        // Create order
        const { data } = await api.post(
          '/payment/create-order',
          { amount: total, deliveryAddress, deliveryPhone },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Verify payment with test data
        await api.post(
          '/payment/verify-payment',
          {
            razorpay_order_id: data.orderId,
            razorpay_payment_id: 'test_payment_' + Date.now(),
            razorpay_signature: 'test_signature',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        toast.dismiss()
        toast.success('Test payment successful! (Configure Razorpay keys for real payments)')
        navigate('/orders')
        return
      }

      // REAL MODE: Use Razorpay
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.')
        setProcessing(false)
        return
      }

      // Create order
      const { data } = await api.post(
        '/payment/create-order',
        { amount: total, deliveryAddress, deliveryPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Razorpay options
      const options = {
        key: razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Eco Basket',
        description: 'Order Payment',
        order_id: data.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyRes = await api.post(
              '/payment/verify-payment',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )

            toast.success('Payment successful!')
            navigate('/orders')
          } catch (err) {
            toast.error('Payment verification failed')
            console.error(err)
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: deliveryPhone,
        },
        theme: {
          color: '#16a34a',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', (response) => {
        toast.error('Payment failed. Please try again.')
        console.error(response.error)
      })
      razorpay.open()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <p className="text-gray-600">Loading...</p>

  if (items.length === 0) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="card-body text-center">
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add items to your cart before checking out</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Delivery Details */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows="3"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="divide-y">
                {items.map((i) => (
                  <div key={i.product?._id} className="flex items-center gap-4 py-3">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {i.product?.image && (
                        <img
                          src={i.product.image}
                          alt={i.product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{i.product?.name}</div>
                      <div className="text-sm text-gray-600">
                        {formatINR(i.product?.price || 0)} × {i.qty}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatINR((i.product?.price || 0) * i.qty)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <aside className="md:col-span-1">
          <div className="card sticky top-4">
            <div className="card-body space-y-4">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatINR(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-emerald-600">FREE</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? 'Processing...' : `Pay ${formatINR(total)}`}
              </button>
              <button
                className="btn btn-outline w-full"
                onClick={() => navigate('/cart')}
                disabled={processing}
              >
                Back to Cart
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
