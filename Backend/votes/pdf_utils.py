"""
Utilitaires pour générer et lire des PDFs de votes chiffrés
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from datetime import datetime
import PyPDF2


def generate_m1_pdf(vote):
    """
    Génère un PDF contenant M1 chiffré (identité)
    
    Args:
        vote: Instance de Vote
    
    Returns:
        BytesIO: Buffer contenant le PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor='#1e3a8a',
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor='#1e40af',
        spaceAfter=10
    )
    
    normal_style = styles['Normal']
    
    # Contenu
    story = []
    
    # Titre
    story.append(Paragraph("Identité Votant Chiffrée (M1)", title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Informations
    story.append(Paragraph(f"<b>ID du Vote:</b> #{vote.id}", normal_style))
    story.append(Paragraph(f"<b>Élection:</b> {vote.election.title}", normal_style))
    story.append(Paragraph(f"<b>Date de soumission:</b> {vote.submitted_at.strftime('%d/%m/%Y %H:%M:%S')}", normal_style))
    story.append(Paragraph(f"<b>ID Unique:</b> {vote.unique_id}", normal_style))
    story.append(Spacer(1, 0.8*cm))
    
    # Bloc M1 chiffré
    story.append(Paragraph("Contenu M1 (Identité Chiffrée):", heading_style))
    story.append(Spacer(1, 0.3*cm))
    
    # Préformaté pour conserver le format PGP
    pgp_style = ParagraphStyle(
        'PGPStyle',
        parent=styles['Code'],
        fontSize=8,
        fontName='Courier',
        leftIndent=10,
        rightIndent=10,
        spaceAfter=10
    )
    
    story.append(Preformatted(vote.m1_identity, pgp_style))
    
    # Footer
    story.append(Spacer(1, 1*cm))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor='#6b7280',
        alignment=TA_CENTER
    )
    story.append(Paragraph("Ce document contient des données chiffrées OpenPGP", footer_style))
    story.append(Paragraph("Accessible uniquement par le CO (Commission d'Organisation)", footer_style))
    
    # Générer le PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer


def generate_m2_pdf(vote):
    """
    Génère un PDF contenant M2 chiffré (bulletin)
    
    Args:
        vote: Instance de Vote
    
    Returns:
        BytesIO: Buffer contenant le PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor='#1e3a8a',
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor='#1e40af',
        spaceAfter=10
    )
    
    normal_style = styles['Normal']
    
    # Contenu
    story = []
    
    # Titre
    story.append(Paragraph("Preuve de Vote Chiffré", title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Informations
    story.append(Paragraph(f"<b>ID du Vote:</b> #{vote.id}", normal_style))
    story.append(Paragraph(f"<b>Date:</b> {vote.submitted_at.strftime('%d/%m/%Y %H:%M:%S')}", normal_style))
    story.append(Paragraph(f"<b>ID Unique:</b> {vote.unique_id}", normal_style))
    
    if vote.co_verified_at:
        story.append(Paragraph(f"<b>Approuvé par CO le:</b> {vote.co_verified_at.strftime('%d/%m/%Y %H:%M:%S')}", normal_style))
    
    story.append(Spacer(1, 0.8*cm))
    
    # Bloc M2 chiffré
    story.append(Paragraph("Contenu M2 (Chiffré):", heading_style))
    story.append(Spacer(1, 0.3*cm))
    
    # Préformaté pour conserver le format PGP
    pgp_style = ParagraphStyle(
        'PGPStyle',
        parent=styles['Code'],
        fontSize=8,
        fontName='Courier',
        leftIndent=10,
        rightIndent=10,
        spaceAfter=10
    )
    
    story.append(Preformatted(vote.m2_ballot, pgp_style))
    
    # Footer
    story.append(Spacer(1, 1*cm))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor='#6b7280',
        alignment=TA_CENTER
    )
    story.append(Paragraph("Ce bulletin est anonyme et chiffré avec OpenPGP", footer_style))
    story.append(Paragraph("Déchiffrable uniquement par le DE (Centre de Dépouillement)", footer_style))
    
    # Générer le PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer


def extract_pgp_from_pdf(pdf_file):
    """
    Extrait le bloc PGP MESSAGE d'un PDF
    
    Args:
        pdf_file: Fichier PDF (BytesIO ou file object)
    
    Returns:
        str: Bloc PGP MESSAGE ou None
    """
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extraire tout le texte
        full_text = ""
        for page in pdf_reader.pages:
            full_text += page.extract_text()
        
        # Chercher le bloc PGP MESSAGE
        start = full_text.find("-----BEGIN PGP MESSAGE-----")
        end = full_text.find("-----END PGP MESSAGE-----")
        
        if start != -1 and end != -1:
            pgp_block = full_text[start:end + len("-----END PGP MESSAGE-----")]
            return pgp_block
        
        return None
        
    except Exception as e:
        print(f"Erreur lors de l'extraction PGP: {e}")
        return None