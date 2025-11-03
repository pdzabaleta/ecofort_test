import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Cat, CatBreed, Favorite, isFavoriteCat } from './types';

// --- HELPER COMPONENTS ---

export const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-16 h-16 border-4 border-t-4 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div>
  </div>
);

export const Notification: React.FC<{ message: string; type: 'success' | 'error' }> = ({
  message,
  type,
}) => (
  <div
    className={`p-4 mt-4 rounded-md ${
      type === 'error'
        ? 'bg-red-900 border border-red-700 text-red-100'
        : 'bg-green-900 border border-green-700 text-green-100'
    }`}
  >
    {message}
  </div>
);

// --- AUTH COMPONENTS ---

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const authError = await login(username, password);
    setLoading(false);
    if (authError) {
      setError(authError);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-center text-white">
        Welcome Back
      </h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-300"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 mt-1 text-gray-100 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 text-gray-100 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {error && <Notification message={error} type="error" />}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const authError = await register(username, email, password);
    setLoading(false);
    if (authError) {
      setError(authError);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-center text-white">
        Create Account
      </h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="username-reg"
            className="block text-sm font-medium text-gray-300"
          >
            Username
          </label>
          <input
            id="username-reg"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 mt-1 text-gray-100 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="email-reg"
            className="block text-sm font-medium text-gray-300"
          >
            Email
          </label>
          <input
            id="email-reg"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mt-1 text-gray-100 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="password-reg"
            className="block text-sm font-medium text-gray-300"
          >
            Password
          </label>
          <input
            id="password-reg"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 text-gray-100 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {error && <Notification message={error} type="error" />}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-500"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};


// --- CAT COMPONENTS ---

export const CatDetailModal: React.FC<{
  breed: CatBreed;
  onClose: () => void;
}> = ({ breed, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] p-6 overflow-y-auto bg-gray-900 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()} // Stop click from closing modal
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-white">{breed.name}</h2>
        <img
          src={breed.image_url}
          alt={breed.name}
          className="w-full h-64 mt-4 object-cover rounded-md"
        />
        <div className="mt-4 space-y-3 text-gray-300">
          <p><strong className="text-white">Origin:</strong> {breed.origin}</p>
          <p><strong className="text-white">Life Span:</strong> {breed.life_span} years</p>
          <p><strong className="text-white">Temperament:</strong> {breed.temperament}</p>
          <p className="pt-2 border-t border-gray-700">{breed.description}</p>
        </div>
      </div>
    </div>
  );
};

export const CatCard: React.FC<{
  cat: Cat;
  isFavorite: boolean;
  onToggleFavorite: (cat: Cat, isFavorite: boolean) => void;
  onViewDetails: (cat: Cat) => void;
  status?: Favorite['status'];
}> = ({ cat, isFavorite, onToggleFavorite, onViewDetails, status }) => (
  <div className="overflow-hidden bg-gray-800 rounded-lg shadow-lg">
    <img
      src={cat.image_url}
      alt={cat.name}
      className="w-full h-56 object-cover cursor-pointer"
      onClick={() => onViewDetails(cat)}
      onError={(e) => {
        // Fallback image
        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1F2937/7F8EA3?text=Cat+Image';
      }}
    />
    <div className="p-4">
      <h3 className="text-xl font-semibold text-white">{cat.name}</h3>
      
      {/* Status messages for Favorites page */}
      {status === 'raza no disponible' && (
        <p className="text-sm text-red-400">Raza no disponible</p>
      )}
      {status === 'datos sin actualizar' && (
        <p className="text-sm text-yellow-400">Datos sin actualizar</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => onViewDetails(cat)}
          className="text-sm text-blue-400 hover:underline"
        >
          View Details
        </button>
        <button
          onClick={() => onToggleFavorite(cat, isFavorite)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={`p-2 rounded-full ${
            isFavorite
              ? 'text-red-500 bg-red-900' // Favorited style
              : 'text-gray-400 bg-gray-700' // Not favorited style
          } hover:bg-gray-600 transition-colors`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

