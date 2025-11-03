import requests
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import CustomUser, Favorite
from .serializers import UserRegistrationSerializer, FavoriteSerializer
from django.conf import settings

# --- ViewSet for User Registration ---
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
        
        # If data is not valid, return the errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- ViewSet for Managing Favorites ---
class FavoriteViewSet(viewsets.ModelViewSet):
    """
    An endpoint for users to view, add, or remove their favorites.
    The GET list action will sync with the Cat API to check for stale data.
    """
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # This is still used for 'detail', 'update', 'delete' actions
        return self.request.user.favorites.all()

    def get_serializer_context(self):
        # This is used for the 'create' (POST) action
        return {'request': self.request}
    
    # --- THIS IS THE NEW LOGIC ---
    def list(self, request, *args, **kwargs):
        # 1. Get all favorites from our database for this user
        db_favorites = self.request.user.favorites.all().order_by('-created_at')
        
        # 2. Prepare for the response
        synced_favorites_list = []
        
        # 3. Set up Cat API headers
        headers = {
            'x-api-key': settings.CAT_API_KEY
        }
        
        # 4. Loop through each favorite and sync it
        for fav in db_favorites:
            # The Cat API endpoint to get a breed's info is via image search
            url = f"{settings.CAT_API_URL}/images/search?breed_ids={fav.cat_api_id}"
            
            try:
                # 5. Make the external API call
                response = requests.get(url, headers=headers, timeout=5) # 5 sec timeout
                response.raise_for_status() # Check for 4xx/5xx errors
                
                data = response.json()
                
                # 6. Check if the breed still exists
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
                    # --- Case 2: Breed exists, update our data ---
                    breed_data = data[0]['breeds'][0]
                    image_url = data[0].get('url')
                    
                    # Update our database with fresh info
                    fav.name = breed_data.get('name')
                    fav.image_url = image_url
                    fav.save() # Save the updated info
                    
                    synced_favorites_list.append({
                        'id': fav.id,
                        'cat_api_id': fav.cat_api_id,
                        'name': fav.name,
                        'image_url': fav.image_url,
                        'status': 'actualizado' # 'updated'
                    })
            
            except requests.exceptions.ConnectionError:
                # --- Case 3: Internet failure (datos sin actualizar) ---
                synced_favorites_list.append({
                    'id': fav.id,
                    'cat_api_id': fav.cat_api_id,
                    'name': fav.name,
                    'image_url': fav.image_url,
                    'status': 'datos sin actualizar' # 'data not updated'
                })
            
            except requests.exceptions.RequestException:
                # --- Case 4: Other API error (404, 500, timeout, etc.) ---
                # We'll treat this as "data not updated" to be safe
                synced_favorites_list.append({
                    'id': fav.id,
                    'cat_api_id': fav.cat_api_id,
                    'name': fav.name,
                    'image_url': fav.image_url,
                    'status': 'datos sin actualizar' # 'data not updated'
                })
        
        # 7. Return the final synced list to the frontend
        return Response(synced_favorites_list)



# --- Cat API Proxy View ---

class CatBreedsProxyView(APIView):
    """
    A proxy view to fetch cat breeds from The Cat API.
    It handles filtering by name and origin on our server.
    """
    permission_classes = [permissions.AllowAny] # Cualquier usuario puede explorar

    def get(self, request, *args, **kwargs):
        # 1. Get query parameters from the frontend request
        search_name = request.query_params.get('name', None)
        search_origin = request.query_params.get('origin', None)
        
        # 2. Set up the API call
        headers = {
            'x-api-key': settings.CAT_API_KEY
        }
        url = f"{settings.CAT_API_URL}/breeds"

        try:
            # 3. Fetch data from The Cat API
            response = requests.get(url, headers=headers)
            response.raise_for_status() # Raises an error for bad responses (4xx, 5xx)
            data = response.json()
            
            # 4. Filter the results on our server
            filtered_data = []
            for breed in data:
                # We need an image, so we skip breeds without one
                if not breed.get('image', {}).get('url'):
                    continue 

                # Check filters
                passes_name_filter = True
                passes_origin_filter = True
                
                if search_name:
                    if search_name.lower() not in breed.get('name', '').lower():
                        passes_name_filter = False
                        
                if search_origin:
                    if search_origin.lower() not in breed.get('origin', '').lower():
                        passes_origin_filter = False
                
                if passes_name_filter and passes_origin_filter:
                    # 5. Only return the data the frontend needs
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