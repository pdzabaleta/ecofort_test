import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Cat, CatBreed, Favorite, isCatBreed, isFavoriteCat } from './types';
import { 
  LoadingSpinner, 
  Notification, 
  CatCard, 
  CatDetailModal,
  LoginPage,
  RegisterPage
} from './components';

// --- API CONFIG (repetido para claridad) ---
const API_URL = 'http://127.0.0.1:8000/api';

// --- PAGINA: EXPLORE ---
const ExplorePage: React.FC = () => {
  const [breeds, setBreeds] = useState<CatBreed[]>([]);
  const [favorites, setFavorites] = useState<Map<string, Favorite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<CatBreed | null>(null);
  
  // Filtros
  const [nameFilter, setNameFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');

  const { authFetch, isAuthenticated } = useAuth(); // Usamos isAuthenticated

  // Cargar todos los datos de razas y favoritos
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Breeds (Público)
      const query = new URLSearchParams();
      if (nameFilter) query.append('name', nameFilter);
      if (originFilter) query.append('origin', originFilter);
      
      const breedResponse = await fetch(`${API_URL}/breeds/?${query.toString()}`);
      if (!breedResponse.ok) throw new Error('Falló al cargar las razas de gatos.');
      const breedData: CatBreed[] = await breedResponse.json();
      setBreeds(breedData);
      
      if (breedData.length === 0 && (nameFilter || originFilter)) {
        setError('No se encontraron gatos con esos filtros.');
      }

      // 2. Fetch Favorites (Solo si está autenticado)
      if (isAuthenticated) {
        const favResponse = await authFetch('/favorites/');
        if (favResponse.ok) {
          const favData: Favorite[] = await favResponse.json();
          const favMap = new Map<string, Favorite>();
          favData.forEach((fav) => {
            favMap.set(fav.cat_api_id, fav);
          });
          setFavorites(favMap);
        } else {
          console.error('Falló al cargar favoritos.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, nameFilter, originFilter, isAuthenticated]); // Depende de isAuthenticated

  useEffect(() => {
    loadData();
  }, [loadData]); // Se ejecuta al montar y cuando loadData cambia

  const handleToggleFavorite = async (cat: Cat, isFavorite: boolean) => {
    if (!isAuthenticated) {
      setError("Necesitas iniciar sesión para añadir favoritos.");
      return;
    }
    const catApiId = isCatBreed(cat) ? cat.id : cat.cat_api_id;

    if (isFavorite) {
      // --- Remover de Favoritos ---
      const favorite = favorites.get(catApiId);
      if (!favorite) return;

      try {
        const response = await authFetch(`/favorites/${favorite.id}/`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Falló al remover favorito.');
        setFavorites((prev) => {
          const newMap = new Map(prev);
          newMap.delete(catApiId);
          return newMap;
        });
      } catch (err: any) { setError(err.message); }
    } else {
      // --- Añadir a Favoritos ---
      const newFavorite = {
        cat_api_id: catApiId,
        name: cat.name,
        image_url: cat.image_url,
      };

      try {
        const response = await authFetch('/favorites/', {
          method: 'POST',
          body: JSON.stringify(newFavorite),
        });
        if (!response.ok) throw new Error('Falló al añadir favorito.');
        const data: Favorite = await response.json();
        setFavorites((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.cat_api_id, data);
          return newMap;
        });
      } catch (err: any) { setError(err.message); }
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };
  
  const handleViewDetails = (cat: Cat) => {
    // Convertir un Favorito a un objeto CatBreed-like para el modal
    if (isFavoriteCat(cat)) {
      setSelectedCat({
        id: cat.cat_api_id,
        name: cat.name,
        image_url: cat.image_url,
        description: 'Detalles completos están disponibles en la página Explorar.',
        origin: 'N/A',
        temperament: 'N/A',
        life_span: 'N/A',
      });
    } else {
      // Ya es un CatBreed
      setSelectedCat(cat);
    }
  };


  return (
    <div className="p-4 md:p-8">
      {/* Barra de Filtros */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 mb-6 bg-gray-800 rounded-lg shadow-md md:flex md:items-center md:space-x-4"
      >
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300">
            Filtrar por Nombre
          </label>
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Ej: Persian"
            className="w-full px-3 py-2 mt-1 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex-1 mt-4 md:mt-0">
          <label className="block text-sm font-medium text-gray-300">
            Filtrar por Origen
          </label>
          <input
            type="text"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            placeholder="Ej: Egypt"
            className="w-full px-3 py-2 mt-1 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 mt-4 font-medium text-white bg-blue-600 rounded-md shadow-sm md:w-auto md:mt-0 hover:bg-blue-700"
        >
          Buscar
        </button>
      </form>

      {/* Grid */}
      {loading && <LoadingSpinner />}
      {error && !loading && <Notification message={error} type="error" />}
      {!loading && !error && breeds.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {breeds.map((breed) => (
            <CatCard
              key={breed.id}
              cat={breed}
              isFavorite={favorites.has(breed.id)}
              onToggleFavorite={handleToggleFavorite}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
      {!loading && !error && breeds.length === 0 && !nameFilter && !originFilter && (
        <div className="text-center text-gray-400">No se encontraron razas.</div>
      )}

      {/* Modal */}
      {selectedCat && (
        <CatDetailModal
          breed={selectedCat}
          onClose={() => setSelectedCat(null)}
        />
      )}
    </div>
  );
};

// --- PAGINA: FAVORITES ---
const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<CatBreed | null>(null);

  const { authFetch } = useAuth();

  // Cargar favoritos al montar
  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Este es el endpoint especial que se sincroniza con la API!
      const response = await authFetch('/favorites/');
      if (!response.ok) {
        throw new Error('Falló al cargar tus favoritos.');
      }
      const data: Favorite[] = await response.json();
      setFavorites(data);
      if (data.length === 0) {
        setError('Aún no has añadido favoritos.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleToggleFavorite = async (cat: Cat, isFavorite: boolean) => {
    if (!isFavorite || !isFavoriteCat(cat)) return; // Solo remover

    try {
      const response = await authFetch(`/favorites/${cat.id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falló al remover favorito.');
      
      // Remover del estado
      setFavorites((prev) => {
        const newFavs = prev.filter((f) => f.id !== cat.id);
        if (newFavs.length === 0) {
          setError('Aún no has añadido favoritos.');
        }
        return newFavs;
      });
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  // Buscar detalles completos para el modal
  const handleViewDetails = async (cat: Cat) => {
    if (!isFavoriteCat(cat)) return;

    const showPartialDetails = (message: string) => {
      setSelectedCat({
        id: cat.cat_api_id,
        name: cat.name,
        image_url: cat.image_url,
        description: message,
        origin: 'N/A',
        temperament: 'N/A',
        life_span: 'N/A',
      });
    };

    try {
      const response = await fetch(`${API_URL}/breeds/?name=${cat.name}`);
      if (!response.ok) throw new Error('No se pudieron cargar los detalles.');
      
      const data: CatBreed[] = await response.json();
      
      if (data.length > 0) {
        const fullDetail = data.find(b => b.id === cat.cat_api_id) || data[0];
        setSelectedCat(fullDetail);
      } else {
        showPartialDetails('No se pudieron encontrar los detalles completos de esta raza.');
      }
    } catch (err) {
      showPartialDetails('Falló al cargar detalles. Mostrando info guardada.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      {loading && <LoadingSpinner />}
      {error && !loading && (
        <div className="text-center text-gray-400">{error}</div>
      )}
      {!loading && favorites.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((fav) => (
            <CatCard
              key={fav.id}
              cat={fav}
              isFavorite={true} // Siempre es true en esta página
              onToggleFavorite={handleToggleFavorite}
              onViewDetails={handleViewDetails}
              status={fav.status} // Pasa el estado especial
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedCat && (
        <CatDetailModal
          breed={selectedCat}
          onClose={() => setSelectedCat(null)}
        />
      )}
    </div>
  );
};

// --- Dashboard (Manejador de Tabs) ---
type Tab = 'explore' | 'favorites';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const { logout } = useAuth();

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-900 shadow-lg">
        <h1 className="text-2xl font-bold text-white">🐱 Cat Explorer</h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Log Out
        </button>
      </header>

      {/* Botones de Tabs */}
      <nav className="flex bg-gray-800">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'explore'
              ? 'text-white bg-gray-900 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Explorar
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'favorites'
              ? 'text-white bg-gray-900 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Mis Favoritos
        </button>
      </nav>

      {/* Contenido de la Página */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'explore' ? <ExplorePage /> : <FavoritesPage />}
      </main>
    </div>
  );
};

// --- COMPONENTE AuthPage (Selector Login/Register) ---
const AuthPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {showLogin ? <LoginPage /> : <RegisterPage />}
      <button
        onClick={() => setShowLogin(!showLogin)}
        className="mt-6 text-sm text-blue-400 hover:underline"
      >
        {showLogin
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL APP ---
const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Spinner de carga principal mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-950 text-gray-100 flex flex-col">
      {isAuthenticated ? <Dashboard /> : <AuthPage />}
    </div>
  );
};

export default App;

