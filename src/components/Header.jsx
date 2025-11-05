import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="bg-white/90 backdrop-blur sticky top-0 z-20 border-b border-gray-200">
      <div className="container flex items-center h-16 gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-emerald-600 grid place-items-center text-white font-bold">EB</div>
          <span className="text-xl font-semibold">Eco Basket</span>
        </Link>
        <nav className="ml-6 flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-emerald-700">Home</Link>
          <Link to="/cart" className="hover:text-emerald-700">Cart</Link>
          {user && <Link to="/orders" className="hover:text-emerald-700">Orders</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600">Hi, <span className="font-medium">{user.name}</span></span>
              <button className="btn btn-outline" onClick={() => { signOut(); navigate('/signin') }}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn btn-outline">Sign in</Link>
              <Link to="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
