# Create your views here.
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.contrib.auth.models import User

from .models import Task
from .serializers import (
    TaskSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)


# ---------------------------------------------------------------------------
# Task APIs
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tasks(request):
    """List all tasks for the authenticated user with optional filtering."""
    tasks = Task.objects.filter(user=request.user).order_by('-created_at')

    # Filter by completion status (?completed=true / ?completed=false)
    completed_param = request.query_params.get('completed')
    if completed_param is not None:
        tasks = tasks.filter(completed=completed_param.lower() == 'true')

    # Filter by topic (?topic=work)
    topic_param = request.query_params.get('topic')
    if topic_param:
        tasks = tasks.filter(topic__iexact=topic_param)

    # Search across title and description (?search=keyword)
    search_param = request.query_params.get('search')
    if search_param:
        from django.db.models import Q
        tasks = tasks.filter(
            Q(title__icontains=search_param) | Q(description__icontains=search_param)
        )

    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_task(request):
    """Create a new task for the authenticated user."""
    serializer = TaskSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retrieve_task(request, pk):
    """Retrieve a single task by ID for the authenticated user."""
    try:
        task = Task.objects.get(id=pk, user=request.user)
    except Task.DoesNotExist:
        return Response({'detail': 'Task not found.'}, status=404)

    serializer = TaskSerializer(task)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_task(request, pk):
    """
    Unified update endpoint.
    PUT  -> full update (all required fields must be supplied).
    PATCH -> partial update (only supplied fields are updated).
    """
    try:
        task = Task.objects.get(id=pk, user=request.user)
    except Task.DoesNotExist:
        return Response({'detail': 'Task not found.'}, status=404)

    partial = request.method == 'PATCH'
    serializer = TaskSerializer(task, data=request.data, partial=partial)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=200)

    return Response(serializer.errors, status=400)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_task_complete(request, pk):
    """Toggle the completion status of a task without requiring a payload."""
    try:
        task = Task.objects.get(id=pk, user=request.user)
    except Task.DoesNotExist:
        return Response({'detail': 'Task not found.'}, status=404)

    task.completed = not task.completed
    task.save(update_fields=['completed'])

    serializer = TaskSerializer(task)
    return Response(serializer.data, status=200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_task(request, pk):
    """Delete a task owned by the authenticated user."""
    try:
        task = Task.objects.get(id=pk, user=request.user)
        task.delete()
        return Response({'message': 'Task deleted successfully.'}, status=200)
    except Task.DoesNotExist:
        return Response({'detail': 'Task not found.'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_summary(request):
    """Return dashboard metrics for the authenticated user's tasks."""
    now = timezone.now()
    all_tasks = Task.objects.filter(user=request.user)

    total = all_tasks.count()
    completed = all_tasks.filter(completed=True).count()
    pending = all_tasks.filter(completed=False).count()
    overdue = all_tasks.filter(completed=False, completeby__lt=now).count()

    # Group by topic
    from django.db.models import Count
    by_topic = list(
        all_tasks.values('topic').annotate(count=Count('id')).order_by('topic')
    )

    return Response({
        'total_tasks': total,
        'completed_tasks': completed,
        'pending_tasks': pending,
        'overdue_tasks': overdue,
        'by_topic': by_topic,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_topics(request):
    """Return distinct topics used by the authenticated user's tasks."""
    topics = (
        Task.objects.filter(user=request.user)
        .values_list('topic', flat=True)
        .distinct()
        .order_by('topic')
    )
    return Response({'topics': list(topics)})


# ---------------------------------------------------------------------------
# Auth / User APIs
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user account."""
    serializer = UserRegistrationSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {'message': 'User registered successfully.', 'username': serializer.data['username']},
            status=201,
        )

    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """
    Blacklist the provided refresh token to invalidate the session.
    Requires 'rest_framework_simplejwt.token_blacklist' in INSTALLED_APPS.
    Request body: { "refresh": "<refresh_token>" }
    """
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'detail': 'Refresh token is required.'}, status=400)

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logged out successfully.'}, status=200)
    except Exception:
        return Response({'detail': 'Invalid or expired token.'}, status=400)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    GET  -> Return the authenticated user's profile.
    PATCH -> Update email, first_name, or last_name.
    """
    user = request.user

    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    # PATCH
    serializer = UserProfileSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=200)

    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change the authenticated user's password."""
    serializer = ChangePasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    user = request.user

    if not user.check_password(serializer.validated_data['old_password']):
        return Response({'old_password': 'Incorrect password.'}, status=400)

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    return Response({'message': 'Password changed successfully.'}, status=200)
