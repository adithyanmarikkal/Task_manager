from django.urls import path
from . import views

urlpatterns = [

    # ------------------------------------------------------------------
    # Task APIs — RESTful routes
    # ------------------------------------------------------------------
    path('api/tasks/', views.get_tasks),                               # GET  — list (filter/search)
    path('api/tasks/create/', views.create_task),                      # POST — create (legacy alias)
    path('api/tasks/summary/', views.task_summary),                    # GET  — dashboard metrics
    path('api/tasks/topics/', views.list_topics),                      # GET  — distinct topic list

    path('api/tasks/<int:pk>/', views.retrieve_task),                  # GET  — retrieve single task
    path('api/tasks/<int:pk>/update/', views.update_task),             # PUT|PATCH — unified update
    path('api/tasks/<int:pk>/delete/', views.delete_task),             # DELETE — delete task
    path('api/tasks/<int:pk>/toggle/', views.toggle_task_complete),    # PATCH — toggle completion

    # Legacy URL aliases (backward compatible)
    path('api/tasks/update/<int:pk>/', views.update_task),             # PUT|PATCH (legacy)
    path('api/tasks/delete/<int:pk>/', views.delete_task),             # DELETE (legacy)

    # ------------------------------------------------------------------
    # Auth / User APIs
    # ------------------------------------------------------------------
    path('api/register/', views.register_user),                        # POST — register
    path('api/logout/', views.logout_user),                            # POST — logout / blacklist token
    path('api/user/me/', views.user_profile),                          # GET|PATCH — profile
    path('api/user/change-password/', views.change_password),          # POST — change password
]
