import React from 'react'
import NavigationBar from '../../components/NavigationBar'
import { IoReorderThreeSharp } from "react-icons/io5";

function Dashboard() {
  const [isNavBarOpen, setIsNavBarOpen] = React.useState(false);
    const toggleSidebar = () => {
    setIsNavBarOpen(prev => !prev)
  }
  return (
    <main className="flex h-screen">
      {!isNavBarOpen && <IoReorderThreeSharp className='text-4xl cursor-pointer absolute top-4 left-4' onClick={toggleSidebar}/>}
      {isNavBarOpen && <NavigationBar isOpen={isNavBarOpen} onClose={() => setIsNavBarOpen(false)} />}
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-4">Welcome to Your Dashboard</h1>
        <p className="text-gray-700">
          This is your personal dashboard where you can view your health information, vaccination history, and manage your profile.
        </p>
      </div>
    </main>
  )
}

export default Dashboard