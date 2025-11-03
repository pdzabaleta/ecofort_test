import requests
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import CustomUser, Favorite
from .serializers import UserRegistrationSerializer, FavoriteSerializer
from django.conf import settings

# --- Vista de registro ---
class UserRegistrationViewSet(viewsets.ViewSet):
    """
    An endpoint for new users to register.
    """

    permission_classes = [permissions.AllowAny] #<---- cualquier usuario puede acceder a el registro de cuenta

    def create(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid(): #<-- verifica los campos obligatorios del lado backend
            user = serializer.save() 
            return Response(
                {"message": "User created successfully"},  #<----- se crea el usuario 
                status=status.HTTP_201_CREATED
            )
        
        # manejo de errores
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Vista para los favoritos ---
class FavoriteViewSet(viewsets.ModelViewSet):
    """
    An endpoint for users to view, add, or remove their favorites.
    The GET list action will sync with the Cat API to check for stale data.
    """
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.favorites.all() #<---- Todo en uno de django para metodos CRUD

    def get_serializer_context(self):
        return {'request': self.request} #<----- El usuario es quien crea al metodo POST
    
    def list(self, request, *args, **kwargs):
        db_favorites = self.request.user.favorites.all().order_by('-created_at') #<------Obtiene los favoritos del usuario segun su ID
        
        synced_favorites_list = [] #<---- Lista para almacenar la respuesta
        
        
        headers = {
            'x-api-key': settings.CAT_API_KEY #<-----Obtenemos la llave unica de la API 
        }
        
        
        for fav in db_favorites:
            url = f"{settings.CAT_API_URL}/images/search?breed_ids={fav.cat_api_id}" #<-- Se itera sobre cada item para actualizar si es necesario
            
            try:
                response = requests.get(url, headers=headers, timeout=5) 
                response.raise_for_status() #<--- Error handling provenientes de la API, solo tiene 5 segundos 
                
                data = response.json()
                
                # Verifica que la raza todavia exista en la DB
                if not data or not data[0].get('breeds'):
                    # --- Case 1: Breed not found (raza no disponible) ---
                    synced_favorites_list.append({
                        'id': fav.id,
                        'cat_api_id': fav.cat_api_id,
                        'name': f"{fav.name} (No Disponible)",
                        'image_url': fav.image_url, # Show the last known image
                        'status': 'raza no disponible'
                    })
         
                else:
                    # --- Actualiza la raza en caso de cambio la informacion
                    breed_data = data[0]['breeds'][0]
                    image_url = data[0].get('url')
                    
                    
                    fav.name = breed_data.get('name')
                    fav.image_url = image_url
                    fav.save() #<----- Actualiza datos de la mascota
                    
                    synced_favorites_list.append({
                        'id': fav.id,
                        'cat_api_id': fav.cat_api_id,
                        'name': fav.name,
                        'image_url': fav.image_url,
                        'status': 'actualizado'
                    })
            
            except requests.exceptions.ConnectionError:
                # --- En caso de falla de internet
                synced_favorites_list.append({
                    'id': fav.id,
                    'cat_api_id': fav.cat_api_id,
                    'name': fav.name,
                    'image_url': fav.image_url,
                    'status': 'datos sin actualizar' 
                })
            
            except requests.exceptions.RequestException:
                # --- django Maneja los errores de la API ante eventualidad 404, 500
                synced_favorites_list.append({
                    'id': fav.id,
                    'cat_api_id': fav.cat_api_id,
                    'name': fav.name,
                    'image_url': fav.image_url,
                    'status': 'datos sin actualizar' 
                })
        
        
        return Response(synced_favorites_list)


# --- Cat API Proxy View ---

class CatBreedsProxyView(APIView):
    """
    A proxy view to fetch cat breeds from The Cat API.
    It handles filtering by name and origin on our server.
    """
    permission_classes = [permissions.AllowAny] # Cualquier usuario puede explorar

    def get(self, request, *args, **kwargs):
        search_name = request.query_params.get('name', None)
        search_origin = request.query_params.get('origin', None) #<--Parametros del front
        
        headers = {
            'x-api-key': settings.CAT_API_KEY
        }
        url = f"{settings.CAT_API_URL}/breeds"

        try:
           
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json() #<---Trae los datos de la api en formato json
            
            filtered_data = []
            for breed in data:
                if not breed.get('image', {}).get('url'):
                    continue #<--- Dice que si no hay imagen en la api se salte la mascota

                passes_name_filter = True
                passes_origin_filter = True
                
                if search_name:
                    if search_name.lower() not in breed.get('name', '').lower():
                        passes_name_filter = False
                        
                if search_origin:
                    if search_origin.lower() not in breed.get('origin', '').lower():
                        passes_origin_filter = False
                
                if passes_name_filter and passes_origin_filter:
                    # Solo se retorna lo necesario para el front
                    filtered_data.append({
                        'id': breed.get('id'),
                        'name': breed.get('name'),
                        'origin': breed.get('origin'),
                        'description': breed.get('description'),
                        'temperament': breed.get('temperament'),
                        'life_span': breed.get('life_span'),
                        'image_url': breed.get('image', {}).get('url')
                    })
            
            return Response(filtered_data)

        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to fetch from Cat API: {str(e)}"}, 
                status=status.HTTP_502_BAD_GATEWAY
            )