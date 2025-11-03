// --- TYPE DEFINITIONS ---
// Matches the Cat API proxy in Django
export type CatBreed = {
  id: string;
  name: string;
  origin: string;
  description: string;
  temperament: string;
  life_span: string;
  image_url: string;
};

// Matches the Favorite model in Django
export type Favorite = {
  id: number;
  cat_api_id: string;
  name: string;
  image_url: string;
  // This is the custom status from our smart Django endpoint
  status?: 'actualizado' | 'raza no disponible' | 'datos sin actualizar';
};

// This union type helps TS know what we're working with
export type Cat = CatBreed | Favorite;

// A type guard to check if an object is a CatBreed
export function isCatBreed(cat: Cat): cat is CatBreed {
  return (cat as CatBreed).description !== undefined;
}

// *** THIS IS THE BUG FIX ***
// We rename this function to 'isFavoriteCat' to avoid conflict 
// with the 'isFavorite' prop in our components.
export function isFavoriteCat(cat: Cat): cat is Favorite {
  return (cat as Favorite).cat_api_id !== undefined;
}

export type AuthToken = {
  access: string;
  refresh: string;
};

