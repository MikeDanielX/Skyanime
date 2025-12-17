import { useEffect, useState } from 'react'; // <--- Import Hooks
import AnimeCard from './AnimeCard';
import SkeletonCard from './SkeletonCard.jsx'

const AnimeGrid = () => {
  // 1. STATE: Places to store data
  // animeList: Stores the array of anime we get from the API
  const [animeList, setAnimeList] = useState([]);
  // loading: Tracks if we are still waiting for data (starts as true)
  const [loading, setLoading] = useState(true);

  // 2. EFFECT: The "Action" that happens when the component loads
  useEffect(() => {
    // We define an async function inside because useEffect itself cannot be async
    const fetchAnime = async () => {
      try {
        // A. Request data from Jikan API (Top Anime, limit to 10)
        const response = await fetch('https://api.jikan.moe/v4/top/anime?limit=10');
        const data = await response.json();

        // B. The "Adapter": Transform messy API data into clean data for our cards
        // Jikan returns the list inside data.data
        const cleanData = data.data.map((anime) => ({
          id: anime.mal_id,
          title: anime.title_english || anime.title, // Use English title if available
          image: anime.images.jpg.large_image_url,   // Dig deep to find the image
          year: anime.year || "N/A",                 // Handle missing years
          rating: anime.score,                       // The score out of 10
        }));

        // C. Save the clean data to state
        setAnimeList(cleanData);
      } catch (error) {
        console.error("Error fetching anime:", error);
      } finally {
        // D. Turn off the loading flag (whether we succeeded or failed)
        setLoading(false);
      }
    };

    fetchAnime(); // <--- Run the function we just defined
  }, []); // <--- Empty dependency array [] means "Run only once on mount"

  // 3. RENDER: Handle Loading vs Content
  if (loading) {
    // Instead of text, we render 10 SkeletonCards
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {[...Array(10)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {animeList.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  );
};

export default AnimeGrid;
