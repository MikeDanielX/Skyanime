import { Link } from 'react-router-dom';


const AnimeCard = ({ anime }) => {
  return (
    // group: Allows us to control child elements when hovering the parent
    // relative: We will overlay text on top of the image
    // Wrap everything in a Link pointing to /anime/ID
    <Link to={`/anime/${anime.id}`}>
      <div className="group relative rounded-lg overflow-hidden cursor-pointer h-[300px] shadow-lg transition-all hover:scale-105 hover:shadow-2xl hover:z-10">
        
        {/* Image */}
        <img 
          src={anime.image} 
          alt={anime.title} 
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
        />
        
        {/* Gradient Overlay (Only visible on hover or always visible for readability) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          
          {/* Text appears on hover */}
          <div>
            <h3 className="text-white font-bold text-lg">{anime.title}</h3>
            <p className="text-gray-300 text-sm">{anime.year} • {anime.rating}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AnimeCard;