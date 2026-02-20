import React from 'react'
import {Outlet, useLocation} from 'react-router-dom'
import Header from './Header';
function Layout() {
   const location = useLocation();
  return (
     <div className="min-h-screen bg-gray-50">
         <Header/>
         <Outlet/>
    </div>
  )
}

export default Layout