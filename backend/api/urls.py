from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'favorites', views.FavoriteViewSet, basename='favorite')
router.register(r'register', views.UserRegistrationViewSet, basename='register')

urlpatterns = [
    path('', include(router.urls)),

      path('breeds/', views.CatBreedsProxyView.as_view(), name='cat-breeds'), #<------ esto llama al proxy de la api the cat
]