import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // <--- useParams gets the ID from URL

const AnimeDetails = () => {
  const { id } = useParams(); // 1. Grab the ID from the URL (e.g., 52991)
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      try {
        // 2. Fetch specific anime by ID
        const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
        const data = await response.json();
        setAnime(data.data); // Jikan returns the object inside 'data'
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetails();
  }, [id]); // <--- Run this whenever the ID changes

  if (loading) return <div className="text-white text-center mt-20 text-2xl">Loading details...</div>;

  if (!anime) return <div className="text-white text-center mt-20">Anime not found.</div>;

  return (
    <div className="min-h-screen text-white pt-24 px-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link to="/" className="inline-block mb-8 text-gray-400 hover:text-white transition">
        ← Back to Home
      </Link>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-[300px_1fr] gap-12">
        
        {/* Left Column: Poster Image */}
        <div>
          <img 
            src={anime.images.jpg.large_image_url} 
            alt={anime.title} 
            className="w-full rounded-lg shadow-2xl border-4 border-gray-700"
          />
          
          <div className="mt-6 bg-gray-800 p-4 rounded-lg text-center">
            <span className="block text-3xl font-bold text-red-500">{anime.score || "N/A"}</span>
            <span className="text-sm text-gray-400">Score</span>
          </div>
        </div>

        {/* Right Column: Info */}
        <div>
          <h1 className="text-5xl font-bold mb-4">{anime.title}</h1>
          <p className="text-xl text-gray-400 mb-6">
            {anime.year ? `${anime.year} • ` : ''} 
            {anime.type}
          </p>

          {/* Genre Tags */}
          <div className="flex flex-wrap gap-3 mb-8">
            {anime.genres.map((genre) => (
              <span key={genre.mal_id} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                {genre.name}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 border-l-4 border-red-600 pl-3">Synopsis</h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              {anime.synopsis}
            </p>
          </div>

          {/* Trailer Button (If available) */}
          {anime.trailer?.url && (
            <a 
              href={anime.trailer.url} 
              target="_blank" 
              rel="noreferrer"
              className="inline-block bg-red-600 px-8 py-3 rounded font-bold hover:bg-red-700 transition"
            >
              Watch Trailer
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimeDetails;