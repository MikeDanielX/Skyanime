const Navbar = () => {
  return (
    // OLD: "bg-gray-900 relative ..."
    // NEW: "absolute top-0 w-full z-10 ..."
    <nav className="absolute top-0 w-full z-10 p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/70 to-transparent">
      
      {/* ... keeping your Logo and Search code exactly the same ... */}
      <div className="text-2xl font-bold text-white-600 tracking-wider cursor-pointer">
        ANI-MIND
      </div>

      <div>
        <input 
          type="text" 
          placeholder="Search anime..." 
          className="p-2 rounded bg-black/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-red-600 transition"
        />
      </div>
    </nav>
  );
};

export default Navbar;