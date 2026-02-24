# from rest_framework import generics, status, permissions
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from django.shortcuts import get_object_or_404
# from django.utils import timezone
# from django.http import FileResponse
# from django.db.models import Count
# from reportlab.lib.pagesizes import A4
# from reportlab.pdfgen import canvas
# from reportlab.lib.units import cm
# from reportlab.lib.utils import ImageReader
# from reportlab.platypus import Table, TableStyle
# from reportlab.lib import colors
# from io import BytesIO
# import os

# from .models import ElectionResult, CandidateResult
# from .serializers import ElectionResultSerializer
# from elections.models import Election
# from votes.models import DecryptedBallot
# from candidates.models import Candidate


# class CalculateResultsView(APIView):
#     """
#     POST /api/results/calculate/<election_id>/ - Calculate election results
#     Only DE or Admin can trigger this
#     """
#     permission_classes = [permissions.IsAuthenticated]
    
#     def post(self, request, election_id):
#         # Only admin or DE can calculate results
#         if request.user.role not in ['admin', 'de']:
#             return Response({
#                 'error': 'Seul un administrateur ou le DE peut calculer les résultats.'
#             }, status=status.HTTP_403_FORBIDDEN)
        
#         election = get_object_or_404(Election, pk=election_id)
        
#         # Election must be closed
#         if election.status != 'closed':
#             return Response({
#                 'error': 'L\'élection doit être fermée pour calculer les résultats.'
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         # Get all decrypted ballots for this election
#         ballots = DecryptedBallot.objects.filter(election=election)
        
#         # Count votes per candidate
#         vote_counts = ballots.values('candidate').annotate(
#             count=Count('candidate')
#         ).order_by('-count')
        
#         total_votes = ballots.count()
        
#         # Create or update election result
#         election_result, created = ElectionResult.objects.get_or_create(
#             election=election,
#             defaults={
#                 'total_votes_cast': total_votes,
#                 'total_valid_votes': total_votes,
#                 'total_invalid_votes': 0
#             }
#         )
        
#         if not created:
#             election_result.total_votes_cast = total_votes
#             election_result.total_valid_votes = total_votes
#             election_result.save()
        
#         # Delete old candidate results
#         CandidateResult.objects.filter(election_result=election_result).delete()
        
#         # Create new candidate results
#         rank = 1
#         for vote_data in vote_counts:
#             candidate_id = vote_data['candidate']
#             vote_count = vote_data['count']
#             percentage = (vote_count / total_votes * 100) if total_votes > 0 else 0
            
#             CandidateResult.objects.create(
#                 election_result=election_result,
#                 candidate_id=candidate_id,
#                 vote_count=vote_count,
#                 percentage=round(percentage, 2),
#                 rank=rank
#             )
#             rank += 1
        
#         return Response({
#             'message': 'Résultats calculés avec succès.',
#             'result': ElectionResultSerializer(election_result).data
#         }, status=status.HTTP_200_OK)


# class PublishResultsView(APIView):
#     """
#     POST /api/results/publish/<election_id>/ - Publish election results
#     Only Admin can publish
#     """
#     permission_classes = [permissions.IsAuthenticated]
    
#     def post(self, request, election_id):
#         # Only admin can publish results
#         if request.user.role != 'admin':
#             return Response({
#                 'error': 'Seul un administrateur peut publier les résultats.'
#             }, status=status.HTTP_403_FORBIDDEN)
        
#         election = get_object_or_404(Election, pk=election_id)
        
#         # Check if results exist
#         try:
#             election_result = election.result
#         except ElectionResult.DoesNotExist:
#             return Response({
#                 'error': 'Les résultats n\'ont pas encore été calculés.'
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         # Check if already published
#         if election_result.is_published:
#             return Response({
#                 'error': 'Les résultats sont déjà publiés.'
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         # Publish results
#         election_result.is_published = True
#         election_result.published_at = timezone.now()
#         election_result.published_by = request.user
#         election_result.save()
        
#         return Response({
#             'message': 'Résultats publiés avec succès.',
#             'result': ElectionResultSerializer(election_result).data
#         }, status=status.HTTP_200_OK)


# class ElectionResultView(generics.RetrieveAPIView):
#     """
#     GET /api/results/<election_id>/ - Get election results
#     """
#     serializer_class = ElectionResultSerializer
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get_object(self):
#         election_id = self.kwargs.get('election_id')
#         election = get_object_or_404(Election, pk=election_id)
        
#         try:
#             election_result = election.result
#         except ElectionResult.DoesNotExist:
#             return Response({
#                 'error': 'Les résultats n\'ont pas encore été calculés.'
#             }, status=status.HTTP_404_NOT_FOUND)
        
#         # Check permissions
#         user = self.request.user
        
#         # Admin and DE can always see results
#         if user.role in ['admin', 'de']:
#             return election_result
        
#         # Voters can only see published results
#         if user.role == 'voter':
#             if not election_result.is_published:
#                 return Response({
#                     'error': 'Les résultats ne sont pas encore publiés.'
#                 }, status=status.HTTP_403_FORBIDDEN)
#             return election_result
        
#         return Response({
#             'error': 'Vous n\'êtes pas autorisé à voir ces résultats.'
#         }, status=status.HTTP_403_FORBIDDEN)


# class PublishedResultsListView(generics.ListAPIView):
#     """
#     GET /api/results/ - List all published results
#     """
#     serializer_class = ElectionResultSerializer
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get_queryset(self):
#         user = self.request.user
        
#         # Admin can see all results
#         if user.role == 'admin':
#             return ElectionResult.objects.all()
        
#         # Others can only see published results
#         return ElectionResult.objects.filter(is_published=True)


# class ExportResultsPDFView(APIView):
#     """
#     GET /api/results/<election_id>/export-pdf/ - Export results as PDF
#     ✅ NOUVEAU: PDF professionnel avec gagnant en haut + tableau
#     """
#     permission_classes = [permissions.IsAuthenticated]

#     def get(self, request, election_id):
#         # Seul l'admin peut exporter
#         if request.user.role not in ['admin', 'de']:
#             return Response({
#                 'error': 'Accès non autorisé'
#             }, status=status.HTTP_403_FORBIDDEN)

#         election = get_object_or_404(Election, pk=election_id)

#         # Vérifier que l'élection est fermée
#         if election.status != 'closed':
#             return Response({
#                 'error': 'L\'élection doit être fermée pour exporter les résultats'
#             }, status=status.HTTP_400_BAD_REQUEST)

#         # Récupérer les bulletins déchiffrés
#         ballots = DecryptedBallot.objects.filter(
#             election=election
#         ).values('candidate').annotate(
#             vote_count=Count('candidate')
#         ).order_by('-vote_count')

#         if not ballots.exists():
#             return Response({
#                 'error': 'Aucun résultat disponible'
#             }, status=status.HTTP_404_NOT_FOUND)

#         # Récupérer les candidats avec leurs infos
#         results = []
#         total_votes = 0
#         for ballot in ballots:
#             candidate = get_object_or_404(Candidate, pk=ballot['candidate'])
#             vote_count = ballot['vote_count']
#             total_votes += vote_count
#             results.append({
#                 'candidate': candidate,
#                 'vote_count': vote_count
#             })

#         # Calculer les pourcentages
#         for result in results:
#             result['percentage'] = (result['vote_count'] / total_votes * 100) if total_votes > 0 else 0

#         # Générer le PDF
#         pdf_buffer = self.generate_results_pdf(election, results, total_votes)

#         # Retourner le fichier
#         response = FileResponse(
#             pdf_buffer,
#             as_attachment=True,
#             filename=f'resultats_{election.title.replace(" ", "_")}.pdf'
#         )
#         response['Content-Type'] = 'application/pdf'

#         return response

#     def generate_results_pdf(self, election, results, total_votes):
#         """
#         Génère un PDF professionnel avec:
#         - Gagnant en haut avec photo
#         - Tableau détaillé des résultats
#         """
#         buffer = BytesIO()
#         p = canvas.Canvas(buffer, pagesize=A4)
#         width, height = A4

#         # ========== EN-TÊTE ==========
#         p.setFont("Helvetica-Bold", 24)
#         p.drawCentredString(width/2, height - 3*cm, "🏆 RÉSULTATS DE L'ÉLECTION")

#         p.setFont("Helvetica-Bold", 16)
#         p.drawCentredString(width/2, height - 4.5*cm, election.title)

#         # Ligne de séparation
#         p.setStrokeColorRGB(0.2, 0.4, 0.8)
#         p.setLineWidth(2)
#         p.line(3*cm, height - 5.5*cm, width - 3*cm, height - 5.5*cm)

#         # ========== GAGNANT ==========
#         if results:
#             winner = results[0]
#             y = height - 7.5*cm

#             # Encadré du gagnant
#             p.setFillColorRGB(0.95, 0.85, 0.2)  # Jaune or
#             p.roundRect(3*cm, y - 3.5*cm, width - 6*cm, 3*cm, 10, fill=1, stroke=0)

#             # Photo du gagnant
#             if winner['candidate'].photo:
#                 try:
#                     photo_path = winner['candidate'].photo.path
#                     if os.path.exists(photo_path):
#                         img = ImageReader(photo_path)
#                         p.drawImage(
#                             img,
#                             4*cm,
#                             y - 3*cm,
#                             width=2.5*cm,
#                             height=2.5*cm,
#                             mask='auto'
#                         )
#                 except Exception as e:
#                     print(f"Erreur chargement photo: {e}")

#             # Texte du gagnant
#             p.setFillColorRGB(0, 0, 0)
#             p.setFont("Helvetica-Bold", 20)
#             p.drawString(7*cm, y - 1*cm, "🥇 GAGNANT")

#             p.setFont("Helvetica-Bold", 16)
#             p.drawString(7*cm, y - 2*cm, winner['candidate'].name)

#             p.setFont("Helvetica", 14)
#             p.drawString(7*cm, y - 2.8*cm, f"{winner['vote_count']} vote(s) - {winner['percentage']:.1f}%")

#             # ========== TABLEAU DES RÉSULTATS ==========
#             y = height - 12*cm

#             p.setFillColorRGB(0, 0, 0)
#             p.setFont("Helvetica-Bold", 14)
#             p.drawString(3*cm, y, "Résultats détaillés:")

#             y -= 1.5*cm

#             # Données du tableau
#             table_data = [
#                 ['Rang', 'Photo', 'Candidat', 'ID', 'Votes', '%']
#             ]

#             for idx, result in enumerate(results, 1):
#                 table_data.append([
#                     str(idx),
#                     '',  # Placeholder pour photo
#                     result['candidate'].name,
#                     f"#{result['candidate'].id}",
#                     str(result['vote_count']),
#                     f"{result['percentage']:.1f}%"
#                 ])

#             # Créer le tableau
#             table = Table(table_data, colWidths=[1.5*cm, 2*cm, 5*cm, 2*cm, 2*cm, 2.5*cm])

#             # Style du tableau
#             table.setStyle(TableStyle([
#                 # En-tête
#                 ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
#                 ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
#                 ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
#                 ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
#                 ('FONTSIZE', (0, 0), (-1, 0), 11),
#                 ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

#                 # Corps du tableau
#                 ('BACKGROUND', (0, 1), (-1, -1), colors.white),
#                 ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
#                 ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # Rang
#                 ('ALIGN', (1, 1), (1, -1), 'CENTER'),  # Photo
#                 ('ALIGN', (3, 1), (-1, -1), 'CENTER'),  # ID, Votes, %
#                 ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
#                 ('FONTSIZE', (0, 1), (-1, -1), 10),
#                 ('GRID', (0, 0), (-1, -1), 1, colors.grey),
#                 ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
#                 ('TOPPADDING', (0, 1), (-1, -1), 10),
#                 ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
#             ]))

#             # Ajouter les photos dans le tableau
#             for idx, result in enumerate(results, 1):
#                 if result['candidate'].photo:
#                     try:
#                         photo_path = result['candidate'].photo.path
#                         if os.path.exists(photo_path):
#                             img = ImageReader(photo_path)
#                             # Dessiner la photo directement dans la cellule
#                             row_y = y - (idx * 1.2*cm)
#                             p.drawImage(
#                                 img,
#                                 5*cm,  # Position X
#                                 row_y,  # Position Y
#                                 width=1.5*cm,
#                                 height=1.5*cm,
#                                 mask='auto'
#                             )
#                     except Exception as e:
#                         print(f"Erreur photo ligne {idx}: {e}")

#             # Dessiner le tableau
#             table.wrapOn(p, width, height)
#             table_height = len(table_data) * 1.2*cm
#             table.drawOn(p, 3*cm, y - table_height)

#             # ========== STATISTIQUES ==========
#             y = y - table_height - 2*cm

#             p.setFont("Helvetica-Bold", 12)
#             p.drawString(3*cm, y, "Statistiques:")

#             y -= 0.8*cm
#             p.setFont("Helvetica", 10)
#             p.drawString(3.5*cm, y, f"• Total de votes comptabilisés: {total_votes}")

#             y -= 0.6*cm
#             p.drawString(3.5*cm, y, f"• Nombre de candidats: {len(results)}")

#             y -= 0.6*cm
#             participation = (total_votes / election.total_voters * 100) if election.total_voters > 0 else 0
#             p.drawString(3.5*cm, y, f"• Taux de participation: {participation:.1f}%")

#         # ========== FOOTER ==========
#         p.setFont("Helvetica-Oblique", 9)
#         p.setFillColorRGB(0.5, 0.5, 0.5)
#         p.drawCentredString(
#             width/2,
#             2*cm,
#             f"Document généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')}"
#         )
#         p.drawCentredString(
#             width/2,
#             1.5*cm,
#             "Vote Électronique Sécurisé - Système de vote chiffré OpenPGP"
#         )

#         p.showPage()
#         p.save()

#         buffer.seek(0)
#         return buffer




from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import FileResponse
from django.db.models import Count
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Table, TableStyle, Image as RLImage
from reportlab.lib import colors
from io import BytesIO
import os

from .models import ElectionResult, CandidateResult
from .serializers import ElectionResultSerializer
from elections.models import Election
from votes.models import DecryptedBallot
from candidates.models import Candidate


class CalculateResultsView(APIView):
    """
    POST /api/results/calculate/<election_id>/ - Calculate election results
    Only DE or Admin can trigger this
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, election_id):
        # Only admin or DE can calculate results
        if request.user.role not in ['admin', 'de']:
            return Response({
                'error': 'Seul un administrateur ou le DE peut calculer les résultats.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=election_id)
        
        # Election must be closed
        if election.status != 'closed':
            return Response({
                'error': 'L\'élection doit être fermée pour calculer les résultats.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all decrypted ballots for this election
        ballots = DecryptedBallot.objects.filter(election=election)
        
        # Count votes per candidate
        vote_counts = ballots.values('candidate').annotate(
            count=Count('candidate')
        ).order_by('-count')
        
        total_votes = ballots.count()
        
        # Create or update election result
        election_result, created = ElectionResult.objects.get_or_create(
            election=election,
            defaults={
                'total_votes_cast': total_votes,
                'total_valid_votes': total_votes,
                'total_invalid_votes': 0
            }
        )
        
        if not created:
            election_result.total_votes_cast = total_votes
            election_result.total_valid_votes = total_votes
            election_result.save()
        
        # Delete old candidate results
        CandidateResult.objects.filter(election_result=election_result).delete()
        
        # Create new candidate results
        rank = 1
        for vote_data in vote_counts:
            candidate_id = vote_data['candidate']
            vote_count = vote_data['count']
            percentage = (vote_count / total_votes * 100) if total_votes > 0 else 0
            
            CandidateResult.objects.create(
                election_result=election_result,
                candidate_id=candidate_id,
                vote_count=vote_count,
                percentage=round(percentage, 2),
                rank=rank
            )
            rank += 1
        
        return Response({
            'message': 'Résultats calculés avec succès.',
            'result': ElectionResultSerializer(election_result).data
        }, status=status.HTTP_200_OK)


class PublishResultsView(APIView):
    """
    POST /api/results/publish/<election_id>/ - Publish election results
    Only Admin can publish
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, election_id):
        # Only admin can publish results
        if request.user.role != 'admin':
            return Response({
                'error': 'Seul un administrateur peut publier les résultats.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        election = get_object_or_404(Election, pk=election_id)
        
        # Check if results exist
        try:
            election_result = election.result
        except ElectionResult.DoesNotExist:
            return Response({
                'error': 'Les résultats n\'ont pas encore été calculés.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already published
        if election_result.is_published:
            return Response({
                'error': 'Les résultats sont déjà publiés.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Publish results
        election_result.is_published = True
        election_result.published_at = timezone.now()
        election_result.published_by = request.user
        election_result.save()
        
        return Response({
            'message': 'Résultats publiés avec succès.',
            'result': ElectionResultSerializer(election_result).data
        }, status=status.HTTP_200_OK)


class ElectionResultView(generics.RetrieveAPIView):
    """
    GET /api/results/<election_id>/ - Get election results
    """
    serializer_class = ElectionResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        election_id = self.kwargs.get('election_id')
        election = get_object_or_404(Election, pk=election_id)
        
        try:
            election_result = election.result
        except ElectionResult.DoesNotExist:
            return Response({
                'error': 'Les résultats n\'ont pas encore été calculés.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        user = self.request.user
        
        # Admin and DE can always see results
        if user.role in ['admin', 'de']:
            return election_result
        
        # Voters can only see published results
        if user.role == 'voter':
            if not election_result.is_published:
                return Response({
                    'error': 'Les résultats ne sont pas encore publiés.'
                }, status=status.HTTP_403_FORBIDDEN)
            return election_result
        
        return Response({
            'error': 'Vous n\'êtes pas autorisé à voir ces résultats.'
        }, status=status.HTTP_403_FORBIDDEN)


class PublishedResultsListView(generics.ListAPIView):
    """
    GET /api/results/ - List all published results
    """
    serializer_class = ElectionResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all results
        if user.role == 'admin':
            return ElectionResult.objects.all()
        
        # Others can only see published results
        return ElectionResult.objects.filter(is_published=True)


class ExportResultsPDFView(APIView):
    """
    GET /api/results/<election_id>/export-pdf/ - Export results as PDF
    ✅ PDF professionnel avec gagnant (fond blanc) + tableau avec photos
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, election_id):
        # Seul l'admin peut exporter
        if request.user.role not in ['admin', 'de']:
            return Response({
                'error': 'Accès non autorisé'
            }, status=status.HTTP_403_FORBIDDEN)

        election = get_object_or_404(Election, pk=election_id)

        # Vérifier que l'élection est fermée
        if election.status != 'closed':
            return Response({
                'error': 'L\'élection doit être fermée pour exporter les résultats'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Récupérer les bulletins déchiffrés
        ballots = DecryptedBallot.objects.filter(
            election=election
        ).values('candidate').annotate(
            vote_count=Count('candidate')
        ).order_by('-vote_count')

        if not ballots.exists():
            return Response({
                'error': 'Aucun résultat disponible'
            }, status=status.HTTP_404_NOT_FOUND)

        # Récupérer les candidats avec leurs infos
        results = []
        total_votes = 0
        for ballot in ballots:
            candidate = get_object_or_404(Candidate, pk=ballot['candidate'])
            vote_count = ballot['vote_count']
            total_votes += vote_count
            results.append({
                'candidate': candidate,
                'vote_count': vote_count
            })

        # Calculer les pourcentages
        for result in results:
            result['percentage'] = (result['vote_count'] / total_votes * 100) if total_votes > 0 else 0

        # Générer le PDF
        pdf_buffer = self.generate_results_pdf(election, results, total_votes)

        # Retourner le fichier
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f'resultats_{election.title.replace(" ", "_")}.pdf'
        )
        response['Content-Type'] = 'application/pdf'

        return response

    def generate_results_pdf(self, election, results, total_votes):
        """
        Génère un PDF professionnel avec:
        - Gagnant en haut avec photo (fond blanc)
        - Tableau détaillé des résultats avec photos bien positionnées
        """
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # ========== EN-TÊTE ==========
        p.setFont("Helvetica-Bold", 24)
        p.drawCentredString(width/2, height - 3*cm, "🏆 RÉSULTATS DE L'ÉLECTION")

        p.setFont("Helvetica-Bold", 16)
        p.drawCentredString(width/2, height - 4.5*cm, election.title)

        # Ligne de séparation
        p.setStrokeColorRGB(0.2, 0.4, 0.8)
        p.setLineWidth(2)
        p.line(3*cm, height - 5.5*cm, width - 3*cm, height - 5.5*cm)

        # ========== GAGNANT ==========
        if results:
            winner = results[0]
            y = height - 7.5*cm

            # ✅ Encadré blanc avec bordure verte
            p.setStrokeColorRGB(1,1,1)  
            p.setFillColorRGB(1, 1, 1)  
            p.setLineWidth(3)
            p.roundRect(3*cm, y - 3.5*cm, width - 6*cm, 3*cm, 10, fill=1, stroke=1)

            # Photo du gagnant
            if winner['candidate'].photo:
                try:
                    photo_path = winner['candidate'].photo.path
                    if os.path.exists(photo_path):
                        img = ImageReader(photo_path)
                        # Photo à gauche
                        p.drawImage(
                            img,
                            4*cm,
                            y - 3*cm,
                            width=2.5*cm,
                            height=2.5*cm,
                            preserveAspectRatio=True,
                            mask='auto'
                        )
                except Exception as e:
                    print(f"Erreur chargement photo gagnant: {e}")

            # Texte du gagnant
            p.setFillColorRGB(0, 0, 0.5)
            p.setFont("Helvetica-Bold", 20)
            p.drawString(7*cm, y - 1*cm, "GAGNANT")

            p.setFont("Helvetica-Bold", 16)
            p.drawString(7*cm, y - 2*cm, winner['candidate'].name)

            p.setFont("Helvetica", 14)
            p.drawString(7*cm, y - 2.8*cm, f"{winner['vote_count']} vote(s) - {winner['percentage']:.1f}%")

        # ========== TABLEAU DES RÉSULTATS ==========
        y_table = height - 12*cm

        p.setFillColorRGB(0, 0, 0)
        p.setFont("Helvetica-Bold", 14)
        p.drawString(3*cm, y_table, "Résultats détaillés:")

        y_table -= 2*cm

        # ✅ Créer tableau avec ReportLab Table (meilleure gestion des photos)
        
        # En-tête du tableau
        table_header = [['Rang', 'Photo', 'Nom du candidat', 'ID', 'Votes', 'Pourcentage']]
        
        # Lignes de données
        table_data = []
        row_height = 2*cm  # Hauteur de chaque ligne
        
        for idx, result in enumerate(results, 1):
            # Photo du candidat (si disponible)
            photo_cell = ''
            if result['candidate'].photo:
                try:
                    photo_path = result['candidate'].photo.path
                    if os.path.exists(photo_path):
                        # ✅ Créer une image ReportLab
                        photo_cell = RLImage(photo_path, width=1.5*cm, height=1.5*cm)
                except Exception as e:
                    print(f"Erreur photo candidat {idx}: {e}")
                    photo_cell = '-'
            else:
                photo_cell = '-'
            
            # Ajouter la ligne
            table_data.append([
                str(idx),
                photo_cell,
                result['candidate'].name,
                f"#{result['candidate'].id}",
                str(result['vote_count']),
                f"{result['percentage']:.1f}%"
            ])
        
        # Combiner en-tête et données
        full_table_data = table_header + table_data
        
        # Créer le tableau
        table = Table(
            full_table_data,
            colWidths=[1.5*cm, 2.5*cm, 6*cm, 2*cm, 2*cm, 2.5*cm],
            rowHeights=[0.8*cm] + [row_height] * len(results)  # En-tête plus petit
        )
        
        # ✅ Style du tableau
        table.setStyle(TableStyle([
            # ========== EN-TÊTE ==========
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            
            # ========== CORPS DU TABLEAU ==========
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # Rang centré
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),  # Photo centrée
            ('ALIGN', (3, 1), (-1, -1), 'CENTER'),  # ID, Votes, % centrés
            ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),  # ✅ Alignement vertical au milieu
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            
            # ========== BORDURES ==========
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2563eb')),
            
            # ========== ALTERNANCE DE COULEURS ==========
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            
            # ========== PADDING ==========
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        # Dessiner le tableau
        table.wrapOn(p, width, height)
        table_height = 0.8*cm + (len(results) * row_height)
        table.drawOn(p, 2.5*cm, y_table - table_height)

        # ========== STATISTIQUES ==========
        y_stats = y_table - table_height - 2*cm

        p.setFont("Helvetica-Bold", 12)
        p.drawString(3*cm, y_stats, "Statistiques:")

        y_stats -= 0.8*cm
        p.setFont("Helvetica", 10)
        p.drawString(3.5*cm, y_stats, f"• Total de votes comptabilisés: {total_votes}")

        y_stats -= 0.6*cm
        p.drawString(3.5*cm, y_stats, f"• Nombre de candidats: {len(results)}")

        y_stats -= 0.6*cm
        participation = (total_votes / election.total_voters * 100) if election.total_voters > 0 else 0
        p.drawString(3.5*cm, y_stats, f"• Taux de participation: {participation:.1f}%")

        # ========== FOOTER ==========
        p.setFont("Helvetica-Oblique", 9)
        p.setFillColorRGB(0.5, 0.5, 0.5)
        p.drawCentredString(
            width/2,
            2*cm,
            f"Document généré le {timezone.now().strftime('%d/%m/%Y à %H:%M')}"
        )
        p.drawCentredString(
            width/2,
            1.5*cm,
            "Vote Électronique Sécurisé - Système de vote chiffré OpenPGP"
        )

        p.showPage()
        p.save()

        buffer.seek(0)
        return buffer