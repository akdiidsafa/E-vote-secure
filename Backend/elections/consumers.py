import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class ElectionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket pour les mises à jour en temps réel des élections
    """
    
    async def connect(self):
        self.election_id = self.scope['url_route']['kwargs']['election_id']
        self.room_group_name = f'election_{self.election_id}'
        
        # Rejoindre le groupe de l'élection
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Envoyer le statut actuel de l'élection
        election_status = await self.get_election_status()
        await self.send(text_data=json.dumps({
            'type': 'election_status',
            'data': election_status
        }))
    
    async def disconnect(self, close_code):
        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Recevoir les messages du client"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))
    
    async def election_opened(self, event):
        """L'élection a été ouverte"""
        await self.send(text_data=json.dumps({
            'type': 'election_opened',
            'message': 'L\'élection est maintenant ouverte!',
            'data': event['data']
        }))
    
    async def election_closed(self, event):
        """L'élection a été fermée"""
        await self.send(text_data=json.dumps({
            'type': 'election_closed',
            'message': 'L\'élection a été fermée.',
            'data': event['data']
        }))
    
    async def new_vote(self, event):
        """Un nouveau vote a été enregistré"""
        await self.send(text_data=json.dumps({
            'type': 'new_vote',
            'message': 'Nouveau vote enregistré',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_election_status(self):
        """Récupérer le statut de l'élection depuis la BDD"""
        from .models import Election
        try:
            election = Election.objects.get(id=self.election_id)
            return {
                'id': election.id,
                'title': election.title,
                'status': election.status,
                'total_votes': election.total_votes,
                'total_voters': election.total_voters,
                'start_date': str(election.start_date),
                'end_date': str(election.end_date),
            }
        except Election.DoesNotExist:
            return None