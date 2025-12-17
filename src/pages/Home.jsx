import Hero from '../components/Hero';
import AnimeGrid from '../components/AnimeGrid';

const Home = () => {
  return (
    <div>
      <Hero />
      <div className="max-w-7xl mx-auto px-8 -mt-16 relative z-20">
        <h2 className="text-2xl font-bold mb-4 pl-2 border-l-4 border-red-600">
          Trending Now
        </h2>
        <AnimeGrid />
      </div>
    </div>
  );
};

export default Home;