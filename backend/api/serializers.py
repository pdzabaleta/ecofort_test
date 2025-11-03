from rest_framework import serializers
from .models import CustomUser, Favorite
from django.contrib.auth.hashers import make_password

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for creating (registering) new users.
    We only use this for 'write' operations (creating).
    """
    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'email'] #<-- datos solicitados 
        extra_kwargs = {
            'password': {'write_only': True} 
        }

    def create(self, validated_data): #<---- hash de la password
        validated_data['password'] = make_password(validated_data['password'])
        user = CustomUser.objects.create(**validated_data)
        return user

class FavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer for the Favorite model.
    Used for reading, creating, and deleting favorites.
    """
    user = serializers.ReadOnlyField(source='user.username') #<--- separa el nombre del id del usuario 

    class Meta:
        model = Favorite
        # Fields to include in the JSON response
        fields = ['id', 'user', 'cat_api_id', 'name', 'image_url', 'created_at']
        
    def create(self, validated_data):
        # This is CRITICAL.
        # When creating a favorite, we must manually assign
        # the user who is making the request.
        # The view (which we'll make next) will pass the 'request'
        # object into the serializer's 'context'.
        validated_data['user'] = self.context['request'].user
        
        return super().create(validated_data)
