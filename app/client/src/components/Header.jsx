import React from 'react'

function Header() {
  return (
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <div className="w-full flex items-center px-6 py-4">
          {/* Logo */}
          <h1 className="text-xl font-bold text-blue-600">
            ImmunizeTrack
          </h1>

          {/* Auth Buttons */}
          <div className="ml-auto flex gap-4">
            <button className="px-4 py-2 text-gray-700 hover:text-blue-600">
              Login
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Sign Up
            </button>
          </div>
        </div>
      </header>
  )
}

export default Header