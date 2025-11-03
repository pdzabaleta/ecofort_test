from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    pass

class Favorite(models.Model): #<----Modelo de favoritos
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="favorites") #<---Si de borra el usuari de la db los favoritos tambien
    
    cat_api_id = models.CharField(max_length=100) #<---ID del gato
    

    name = models.CharField(max_length=255, blank=True, null=True) #<---info basica para almacenar
    image_url = models.URLField(max_length=500, blank=True, null=True)
    

    created_at = models.DateTimeField(auto_now_add=True) #<--- Estampa la fecha de cuando fue creado 

    class Meta:
        unique_together = ('user', 'cat_api_id') #<---No se puede dar favorito 2 veces

    def __str__(self):
        return f"{self.user.username}'s favorite: {self.cat_api_id}"

