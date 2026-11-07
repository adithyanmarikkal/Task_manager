from django.urls import path
from . import views 

urlpatterns = [
    path('api/tasks/', views.get_tasks),
    path('api/tasks/create/', views.create_task),
    path('api/tasks/update/<int:pk>/', views.update_task),
    path('api/tasks/delete/<int:pk>/', views.delete_task),
]