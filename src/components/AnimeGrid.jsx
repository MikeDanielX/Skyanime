import AnimeCard from './AnimeCard';

const AnimeGrid = () => {
  // Temporary Fake Data to test the layout
  const animeList = [
    { id: 1, title: "Attack on Titan", year: 2013, rating: "9.0", image: "https://cdn.myanimelist.net/images/anime/10/47347.jpg" },
    { id: 2, title: "One Piece", year: 1999, rating: "8.9", image: "https://cdn.myanimelist.net/images/anime/6/73245.jpg" },
    { id: 3, title: "Demon Slayer", year: 2019, rating: "8.7", image: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg" },
    { id: 4, title: "Jujutsu Kaisen", year: 2020, rating: "8.8", image: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg" },
    { id: 5, title: "Death Note", year: 2006, rating: "9.0", image: "https://cdn.myanimelist.net/images/anime/9/9453.jpg" },
  ];

  return (
    // The Grid Layout
    // grid-cols-2: Mobile users see 2 items per row
    // md:grid-cols-4: Tablet users see 4 items
    // lg:grid-cols-5: Desktop users see 5 items
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {animeList.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  );
};

export default AnimeGrid;