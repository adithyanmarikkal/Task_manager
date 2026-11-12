from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status

from .models import Task


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

HOST = {'HTTP_HOST': 'localhost'}


def make_user(username, password='StrongPass123!', email=None):
    email = email or f'{username}@example.com'
    return User.objects.create_user(username=username, password=password, email=email)


def make_task(user, title='Test Task', topic='work', description='A task', **kwargs):
    return Task.objects.create(user=user, title=title, topic=topic, description=description, **kwargs)


# ---------------------------------------------------------------------------
# Auth: Registration
# ---------------------------------------------------------------------------

class RegistrationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/register/'

    def test_register_success(self):
        r = self.client.post(self.url, {
            'username': 'alice',
            'email': 'alice@example.com',
            'password': 'StrongPass123!',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertIn('username', r.data)

    def test_register_weak_password_rejected(self):
        r = self.client.post(self.url, {
            'username': 'bob',
            'email': 'bob@example.com',
            'password': '123',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', r.data)

    def test_register_duplicate_email_rejected(self):
        make_user('existing', email='dup@example.com')
        r = self.client.post(self.url, {
            'username': 'newuser',
            'email': 'dup@example.com',
            'password': 'StrongPass123!',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', r.data)

    def test_register_duplicate_username_rejected(self):
        make_user('alice')
        r = self.client.post(self.url, {
            'username': 'alice',
            'email': 'alice2@example.com',
            'password': 'StrongPass123!',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_email_rejected(self):
        r = self.client.post(self.url, {
            'username': 'charlie',
            'password': 'StrongPass123!',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', r.data)


# ---------------------------------------------------------------------------
# Auth: Login (JWT token)
# ---------------------------------------------------------------------------

class LoginTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.url = '/api/token/'

    def test_login_valid_credentials(self):
        r = self.client.post(self.url, {
            'username': 'alice',
            'password': 'StrongPass123!',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)

    def test_login_wrong_password(self):
        r = self.client.post(self.url, {
            'username': 'alice',
            'password': 'wrongpassword',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        r = self.client.post(self.url, {
            'username': 'nobody',
            'password': 'StrongPass123!',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# Auth: Logout
# ---------------------------------------------------------------------------

class LogoutTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.url = '/api/logout/'

    def _get_tokens(self):
        r = self.client.post('/api/token/', {
            'username': 'alice',
            'password': 'StrongPass123!',
        }, format='json', **HOST)
        return r.data['access'], r.data['refresh']

    def test_logout_blacklists_refresh_token(self):
        access, refresh = self._get_tokens()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        r = self.client.post(self.url, {'refresh': refresh}, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_logout_no_refresh_token_returns_400(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.post(self.url, {}, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_requires_authentication(self):
        r = self.client.post(self.url, {}, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# User Profile
# ---------------------------------------------------------------------------

class UserProfileTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/user/me/'

    def test_get_profile(self):
        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['username'], 'alice')

    def test_patch_profile_email(self):
        r = self.client.patch(self.url, {'email': 'new@example.com'}, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['email'], 'new@example.com')

    def test_profile_requires_auth(self):
        self.client.force_authenticate(user=None)
        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# Change Password
# ---------------------------------------------------------------------------

class ChangePasswordTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/user/change-password/'

    def test_change_password_success(self):
        r = self.client.post(self.url, {
            'old_password': 'StrongPass123!',
            'new_password': 'NewSecure@456',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecure@456'))

    def test_change_password_wrong_old(self):
        r = self.client.post(self.url, {
            'old_password': 'wrongpassword',
            'new_password': 'NewSecure@456',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('old_password', r.data)

    def test_change_password_weak_new_rejected(self):
        r = self.client.post(self.url, {
            'old_password': 'StrongPass123!',
            'new_password': '123',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', r.data)


# ---------------------------------------------------------------------------
# Task: List & Filtering
# ---------------------------------------------------------------------------

class TaskListTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.other = make_user('bob')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/tasks/'

    def test_list_returns_only_own_tasks(self):
        make_task(self.user, title='Alice Task')
        make_task(self.other, title='Bob Task')
        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        titles = [t['title'] for t in r.data]
        self.assertIn('Alice Task', titles)
        self.assertNotIn('Bob Task', titles)

    def test_list_requires_auth(self):
        self.client.force_authenticate(user=None)
        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_filter_by_completed_true(self):
        make_task(self.user, title='Done', completed=True)
        make_task(self.user, title='Pending', completed=False)
        r = self.client.get(self.url, {'completed': 'true'}, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(all(t['completed'] for t in r.data))

    def test_filter_by_completed_false(self):
        make_task(self.user, title='Done', completed=True)
        make_task(self.user, title='Pending', completed=False)
        r = self.client.get(self.url, {'completed': 'false'}, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertFalse(any(t['completed'] for t in r.data))

    def test_filter_by_topic(self):
        make_task(self.user, title='Work Task', topic='work')
        make_task(self.user, title='Home Task', topic='home')
        r = self.client.get(self.url, {'topic': 'work'}, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(all(t['topic'].lower() == 'work' for t in r.data))

    def test_search_by_title(self):
        make_task(self.user, title='Read a book', description='Something')
        make_task(self.user, title='Exercise daily', description='Something')
        r = self.client.get(self.url, {'search': 'book'}, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]['title'], 'Read a book')

    def test_search_by_description(self):
        make_task(self.user, title='Task 1', description='Django project')
        make_task(self.user, title='Task 2', description='React frontend')
        r = self.client.get(self.url, {'search': 'Django'}, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.data), 1)


# ---------------------------------------------------------------------------
# Task: Create
# ---------------------------------------------------------------------------

class TaskCreateTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/tasks/create/'

    def test_create_task_success(self):
        r = self.client.post(self.url, {
            'title': 'New Task',
            'topic': 'study',
            'description': 'Study Django',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['title'], 'New Task')
        self.assertEqual(r.data['user'], self.user.id)

    def test_create_task_missing_title_rejected(self):
        r = self.client.post(self.url, {
            'topic': 'study',
            'description': 'Study Django',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', r.data)

    def test_create_task_requires_auth(self):
        self.client.force_authenticate(user=None)
        r = self.client.post(self.url, {
            'title': 'Task', 'topic': 'work', 'description': 'Desc',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# Task: Retrieve (single)
# ---------------------------------------------------------------------------

class TaskRetrieveTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.other = make_user('bob')
        self.task = make_task(self.user)
        self.client.force_authenticate(user=self.user)

    def test_retrieve_own_task(self):
        r = self.client.get(f'/api/tasks/{self.task.id}/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['id'], self.task.id)

    def test_retrieve_other_user_task_returns_404(self):
        other_task = make_task(self.other)
        r = self.client.get(f'/api/tasks/{other_task.id}/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_nonexistent_task_returns_404(self):
        r = self.client.get('/api/tasks/99999/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# Task: Update (PUT & PATCH unified)
# ---------------------------------------------------------------------------

class TaskUpdateTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.other = make_user('bob')
        self.task = make_task(self.user, title='Original')
        self.client.force_authenticate(user=self.user)

    def _url(self, pk=None):
        pk = pk or self.task.id
        return f'/api/tasks/{pk}/update/'

    def test_put_full_update(self):
        r = self.client.put(self._url(), {
            'title': 'Updated Title',
            'topic': 'health',
            'description': 'Go running',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['title'], 'Updated Title')

    def test_patch_partial_update_completed(self):
        r = self.client.patch(self._url(), {'completed': True}, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data['completed'])

    def test_patch_partial_update_title_only(self):
        r = self.client.patch(self._url(), {'title': 'Patched Title'}, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['title'], 'Patched Title')
        # Other fields should be unchanged
        self.assertEqual(r.data['topic'], 'work')

    def test_put_other_user_task_returns_404(self):
        other_task = make_task(self.other)
        r = self.client.put(self._url(other_task.id), {
            'title': 'Hack', 'topic': 'evil', 'description': 'x',
        }, format='json', **HOST)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_legacy_update_url_still_works(self):
        r = self.client.patch(
            f'/api/tasks/update/{self.task.id}/',
            {'title': 'Via Legacy URL'},
            format='json', **HOST,
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['title'], 'Via Legacy URL')


# ---------------------------------------------------------------------------
# Task: Toggle Complete
# ---------------------------------------------------------------------------

class TaskToggleTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.task = make_task(self.user, completed=False)
        self.client.force_authenticate(user=self.user)

    def test_toggle_false_to_true(self):
        r = self.client.patch(f'/api/tasks/{self.task.id}/toggle/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data['completed'])

    def test_toggle_true_to_false(self):
        self.task.completed = True
        self.task.save()
        r = self.client.patch(f'/api/tasks/{self.task.id}/toggle/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertFalse(r.data['completed'])

    def test_toggle_other_user_task_returns_404(self):
        other_user = make_user('bob')
        other_task = make_task(other_user)
        r = self.client.patch(f'/api/tasks/{other_task.id}/toggle/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# Task: Delete
# ---------------------------------------------------------------------------

class TaskDeleteTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.other = make_user('bob')
        self.task = make_task(self.user)
        self.client.force_authenticate(user=self.user)

    def test_delete_own_task(self):
        r = self.client.delete(f'/api/tasks/{self.task.id}/delete/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertFalse(Task.objects.filter(id=self.task.id).exists())

    def test_delete_other_user_task_returns_404(self):
        other_task = make_task(self.other)
        r = self.client.delete(f'/api/tasks/{other_task.id}/delete/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Task.objects.filter(id=other_task.id).exists())

    def test_delete_nonexistent_task_returns_404(self):
        r = self.client.delete('/api/tasks/99999/delete/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_legacy_delete_url_still_works(self):
        task2 = make_task(self.user, title='To Delete')
        r = self.client.delete(f'/api/tasks/delete/{task2.id}/', **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Task: Summary / Analytics
# ---------------------------------------------------------------------------

class TaskSummaryTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/tasks/summary/'

    def test_summary_counts(self):
        make_task(self.user, topic='work', completed=True)
        make_task(self.user, topic='work', completed=False)
        make_task(self.user, topic='home', completed=False,
                  completeby=timezone.now() - timedelta(days=1))

        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['total_tasks'], 3)
        self.assertEqual(r.data['completed_tasks'], 1)
        self.assertEqual(r.data['pending_tasks'], 2)
        self.assertEqual(r.data['overdue_tasks'], 1)

    def test_summary_by_topic(self):
        make_task(self.user, topic='work')
        make_task(self.user, topic='work')
        make_task(self.user, topic='home')

        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        by_topic = {item['topic']: item['count'] for item in r.data['by_topic']}
        self.assertEqual(by_topic['work'], 2)
        self.assertEqual(by_topic['home'], 1)

    def test_summary_empty(self):
        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['total_tasks'], 0)

    def test_summary_isolation(self):
        other = make_user('bob')
        make_task(other, topic='work')
        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.data['total_tasks'], 0)


# ---------------------------------------------------------------------------
# Task: Topics
# ---------------------------------------------------------------------------

class TopicsListTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('alice')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/tasks/topics/'

    def test_returns_distinct_topics(self):
        make_task(self.user, topic='work')
        make_task(self.user, topic='work')
        make_task(self.user, topic='home')
        r = self.client.get(self.url, **HOST)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(sorted(r.data['topics']), ['home', 'work'])

    def test_topics_isolation(self):
        other = make_user('bob')
        make_task(other, topic='secret')
        r = self.client.get(self.url, **HOST)
        self.assertNotIn('secret', r.data['topics'])
