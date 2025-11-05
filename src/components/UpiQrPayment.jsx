import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { formatINR } from '../utils/format'

export default function UpiQrPayment({ amount, onSuccess, onCancel }) {
  const [transactionId, setTransactionId] = useState('')
  const [loading, setLoading] = useState(false)

  // UPI Payment String Format
  // Replace with your actual UPI ID
  const upiId = 'merchant@paytm' // Change this to your UPI ID
  const merchantName = 'Eco Basket'
  const transactionNote = 'Order Payment'
  
  // Generate UPI string
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`

  const handleConfirm = async () => {
    if (!transactionId || transactionId.length < 8) {
      alert('Please enter a valid transaction ID')
      return
    }

    setLoading(true)
    // Simulate verification - In production, verify with your backend
    setTimeout(() => {
      onSuccess({
        razorpay_payment_id: transactionId,
        razorpay_signature: 'upi_qr_payment',
        razorpay_order_id: 'qr_' + Date.now()
      })
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        <div className="text-center space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Scan & Pay</h2>
            <p className="text-sm text-gray-600 mt-1">Scan QR code with any UPI app</p>
          </div>

          {/* Amount */}
          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Amount to Pay</div>
            <div className="text-3xl font-bold text-emerald-600">{formatINR(amount)}</div>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-xl border-4 border-emerald-500 inline-block">
            <QRCodeSVG 
              value={upiString}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* UPI Apps */}
          <div>
            <p className="text-sm text-gray-600 mb-3">Supported Apps</p>
            <div className="flex justify-center gap-4 text-2xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">📱</div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">💳</div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">🏦</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">PhonePe • Google Pay • Paytm • BHIM & more</p>
          </div>

          {/* Transaction ID Input */}
          <div className="text-left space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
              <p className="font-medium text-yellow-800">After payment:</p>
              <p className="text-yellow-700">Enter the Transaction ID from your UPI app</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID / UTR Number
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter 12-digit transaction ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 btn btn-primary"
              disabled={loading || !transactionId}
            >
              {loading ? 'Verifying...' : 'Confirm Payment'}
            </button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 text-left bg-gray-50 rounded-lg p-3">
            <p className="font-semibold mb-1">How to pay:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open any UPI app (PhonePe, Google Pay, etc.)</li>
              <li>Scan the QR code above</li>
              <li>Verify amount {formatINR(amount)}</li>
              <li>Complete payment</li>
              <li>Enter Transaction ID above</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
