import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import { useAuth } from './state/AuthContext'
import Header from './components/Header'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}
