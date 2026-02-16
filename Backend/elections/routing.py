from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/election/(?P<election_id>\w+)/$', consumers.ElectionConsumer.as_asgi()),
]