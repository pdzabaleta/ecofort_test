export type CatBreed = {
  id: string;
  name: string;
  origin: string;
  description: string;
  temperament: string;
  life_span: string;
  image_url: string;
}; // asigna sus valore


export type Favorite = {
  id: number;
  cat_api_id: string;
  name: string;
  image_url: string;
  status?: 'actualizado' | 'raza no disponible' | 'datos sin actualizar';
};

export type Cat = CatBreed | Favorite;

export function isCatBreed(cat: Cat): cat is CatBreed {
  return (cat as CatBreed).description !== undefined; //-- Asegura que sea una raza
}

export function isFavoriteCat(cat: Cat): cat is Favorite {
  return (cat as Favorite).cat_api_id !== undefined;
}

export type AuthToken = {
  access: string;
  refresh: string;
};

