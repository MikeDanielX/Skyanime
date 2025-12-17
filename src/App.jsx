import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AnimeDetails from './pages/AnimeDetails';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-800 text-white pb-10">
        {/* Navbar stays permanent at the top */}
        <Navbar />
        
        <Routes>
          {/* Path "/" = The Home Page */}
          <Route path="/" element={<Home />} />
          
          {/* Path "/anime/:id" = The Details Page 
              The ":id" is a variable (placeholder) for the anime ID */}
          <Route path="/anime/:id" element={<AnimeDetails />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App;