import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import { formatINR } from '../utils/format'
import toast from 'react-hot-toast'
import UpiQrPayment from '../components/UpiQrPayment'

export default function Checkout() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod') // 'online' or 'cod'
  const [showUpiQr, setShowUpiQr] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
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

  const handleCODOrder = async () => {
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
      const { data } = await api.post(
        '/payment/create-cod-order',
        { deliveryAddress, deliveryPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Order placed successfully! Pay on delivery.')
      navigate('/orders')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to place order')
      console.error(err)
    } finally {
      setProcessing(false)
    }
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

    // Handle COD
    if (paymentMethod === 'cod') {
      return handleCODOrder()
    }

    // Handle Online Payment
    setProcessing(true)

    try {
      // Check if Razorpay keys are configured
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID
      const isTestMode = !razorpayKeyId || razorpayKeyId === 'your_razorpay_key_id_here'

      if (isTestMode) {
        // TEST MODE: Show UPI QR Code
        const { data } = await api.post(
          '/payment/create-order',
          { amount: total, deliveryAddress, deliveryPhone },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        
        setCurrentOrder(data)
        setShowUpiQr(true)
        setProcessing(false)
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

      // Razorpay options with UPI QR
      const options = {
        key: razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Eco Basket',
        description: 'Order Payment',
        image: 'https://cdn-icons-png.flaticon.com/512/2331/2331966.png', // Eco/Shopping icon
        order_id: data.orderId,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'All payment methods',
                instruments: [
                  { method: 'upi' },
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
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

  const handleQrPaymentSuccess = async (paymentDetails) => {
    try {
      await api.post(
        '/payment/verify-payment',
        {
          razorpay_order_id: paymentDetails.razorpay_order_id,
          razorpay_payment_id: paymentDetails.razorpay_payment_id,
          razorpay_signature: paymentDetails.razorpay_signature,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setShowUpiQr(false)
      toast.success('Payment successful!')
      navigate('/orders')
    } catch (err) {
      toast.error('Payment verification failed')
      console.error(err)
      setShowUpiQr(false)
    }
  }

  const handleQrPaymentCancel = () => {
    setShowUpiQr(false)
    toast.info('Payment cancelled')
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
    <>
      {/* UPI QR Payment Modal */}
      {showUpiQr && (
        <UpiQrPayment
          amount={total}
          onSuccess={handleQrPaymentSuccess}
          onCancel={handleQrPaymentCancel}
        />
      )}

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

          {/* Payment Method */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-emerald-500 transition"
                  style={{ borderColor: paymentMethod === 'cod' ? '#16a34a' : '#e5e7eb' }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">Cash on Delivery (COD)</div>
                    <div className="text-sm text-gray-600">Pay when you receive your order</div>
                  </div>
                  <span className="text-2xl">💵</span>
                </label>
                
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-emerald-500 transition"
                  style={{ borderColor: paymentMethod === 'online' ? '#16a34a' : '#e5e7eb' }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">Online Payment</div>
                    <div className="text-sm text-gray-600">Pay using UPI, Card, Net Banking</div>
                  </div>
                  <span className="text-2xl">💳</span>
                </label>
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
                {processing ? 'Processing...' : 
                 paymentMethod === 'cod' ? `Place Order (COD) ${formatINR(total)}` : 
                 `Pay ${formatINR(total)}`}
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
    </>
  )
}
