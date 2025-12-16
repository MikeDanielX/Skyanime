import heroImage from '../assets/solo-leveling.png'; 

const Hero = () => {
  return (
    <div 
      className="relative w-full bg-cover bg-center h-[80vh]" // <--- Changed height here
      style={{ backgroundImage: `url(${heroImage})` }} 
    >
      
      {/* 1. Dark Overlay (Overall) - Makes text readable */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* 2. Bottom Fade (The "Netflix Effect") */}
      {/* This gradient goes from transparent to the gray-800 background color */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-gray-800 to-transparent"></div>

      {/* Content */}
      {/* We use flex layout to vertically center the text if you want, 
          OR keep it at the bottom-left like Netflix. */}
      <div className="absolute bottom-0 left-0 p-8 pb-32 w-full md:w-1/2 text-white z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">Solo Leveling</h1>
        <p className="text-lg mb-6 drop-shadow-md line-clamp-3">
          Ten years ago, "the Gate" appeared and connected the real world with the realm of magic and monsters. 
          To combat these vile beasts, ordinary people received superhuman powers and became known as "Hunters".
        </p>
        
        <div className="flex gap-4">
            <button className="bg-red-600 px-8 py-3 rounded font-bold hover:bg-red-700 transition flex items-center gap-2">
              Play Now
            </button>
            <button className="bg-gray-500/70 px-8 py-3 rounded font-bold hover:bg-gray-500/50 transition backdrop-blur-sm">
              More Info
            </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;