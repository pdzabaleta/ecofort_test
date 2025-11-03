from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    pass

# 2. The Favorite model
class Favorite(models.Model): 
    # Links this favorite to a specific user.
    # If a user is deleted, all their favorites are also deleted.
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="favorites")
    
    # The ID of the cat from 'The Cat API' (e.g., "abys")
    cat_api_id = models.CharField(max_length=100)
    
    # Store some basic info so we don't have to re-fetch it
    name = models.CharField(max_length=255, blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Automatically set the date when it was favorited
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # This is a crucial constraint:
        # A user cannot favorite the same cat_api_id more than once.
        unique_together = ('user', 'cat_api_id')

    def __str__(self):
        return f"{self.user.username}'s favorite: {self.cat_api_id}"

