import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import AnimeGrid from './components/AnimeGrid.jsx'

function App() {

  return (
    // min-h-screen: Ensures the app background covers the full height
    // bg-gray-800: Dark gray background for the whole app
    <div className="min-h-screen bg-gray-800 text-white">
      <Navbar />
      <Hero />
      
      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-8 -mt-20 relative z-20"> 
        {/* -mt-16 (Negative Margin): Pulls the grid UP so it overlaps the Hero image slightly (Netflix style) */}
        
        <h2 className="text-2xl font-bold mb-4 pl-2 border-l-4 border-red-600">
          Trending Now
        </h2>
        
        <AnimeGrid />
      </div>
    </div>
  )
}

export default App;