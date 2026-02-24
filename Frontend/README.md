# 🗳️ Vote Électronique Sécurisé

Système de vote électronique sécurisé avec cryptographie OpenPGP end-to-end garantissant l'anonymat des votants et l'intégrité des résultats.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Django](https://img.shields.io/badge/django-6.0.2-green.svg)
![React](https://img.shields.io/badge/react-18.0+-61dafb.svg)

---

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Architecture](#️-architecture)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#️-technologies)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Utilisation](#-utilisation)
- [Workflow de vote](#️-workflow-de-vote)
- [Sécurité](#-sécurité)
- [Structure du projet](#-structure-du-projet)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## 📖 Aperçu

**Vote Électronique Sécurisé** est un système de vote électronique professionnel basé sur la cryptographie OpenPGP qui garantit:

- ✅ **Anonymat absolu** des votants via double chiffrement (M1 + M2)
- ✅ **Intégrité cryptographique** avec linking_id unique
- ✅ **Séparation des responsabilités** entre CO (Centre de Comptage) et DE (Centre de Dépouillement)
- ✅ **Traçabilité sécurisée** avec reçus de vote uniques
- ✅ **Vérifiabilité** des résultats
- ✅ **Interface moderne** et intuitive

### 🎯 Cas d'usage

- Élections professionnelles
- Votes associatifs
- Scrutins syndicaux
- Élections étudiantes
- Consultations internes

---

## 🏗️ Architecture
```
┌─────────────────┐
│    VOTANT       │
│  (Interface)    │
└────────┬────────┘
         │
         │ 1. Vote chiffré (M1 + M2)
         ▼
┌─────────────────────────┐
│   CO                    │
│ (Centre de Comptage)    │
│                         │
│ • Déchiffre M1          │ ← Vérifie l'identité uniquement
│ • Vérifie l'identité    │   (NE voit PAS le vote)
│ • Génère PDF M2         │
└────────┬────────────────┘
         │
         │ 2. M2 chiffré + linking_id
         ▼
┌─────────────────────────┐
│   DE                    │
│ (Centre Dépouillement)  │
│                         │
│ • Déchiffre M2          │ ← Voit le vote uniquement
│ • Comptabilise          │   (NE connaît PAS l'identité)
└────────┬────────────────┘
         │
         │ 3. Résultats anonymes
         ▼
┌─────────────────────────┐
│   ADMINISTRATEUR        │
│                         │
│ • Publie résultats      │
│ • Exporte PDF           │
└─────────────────────────┘
```

### 🔐 Double chiffrement
```
┌──────────────────────────────────────────┐
│           VOTE DU CITOYEN                │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│     M1      │  │     M2      │
│ (Identité)  │  │  (Bulletin) │
│             │  │             │
│ • ID votant │  │ • Candidat  │
│ • Nom       │  │ • linking_id│
│ • Email     │  │             │
│ • linking_id│  │ Chiffré:    │
│             │  │ Clé PUB DE  │
│ Chiffré:    │  └─────────────┘
│ Clé PUB CO  │
└─────────────┘

Résultat: Anonymat total + Intégrité garantie
```

---

## ✨ Fonctionnalités

### 👨‍💼 Administrateur

- 📊 **Gestion des élections**
  - Création, modification, suppression
  - Ouverture/fermeture automatique ou manuelle
  - Génération automatique des clés PGP
  
- 👥 **Gestion des candidats**
  - Ajout avec photos
  - Profession et description
  - Association aux élections
  
- 🗳️ **Gestion des électeurs**
  - Invitation par email
  - Validation des inscriptions
  - Assignation aux élections
  
- 📈 **Consultation des résultats**
  - Résultats en temps réel
  - Graphiques et statistiques
  - Export PDF professionnel

### 🗳️ Votant

- 🔐 **Vote sécurisé**
  - Vote anonyme avec double chiffrement
  - Interface intuitive
  - Confirmation visuelle
  
- 🧾 **Reçu de vote**
  - Code unique de vérification
  - Horodatage
  - Statut du vote en temps réel
  
- 📱 **Suivi**
  - Vérification du statut
  - Notification de comptabilisation
  - Consultation des résultats (si publiés)

### 🛡️ CO (Centre de Comptage)

- 🔍 **Vérification d'identité**
  - Déchiffrement M1 (identité uniquement)
  - Vérification des informations du votant
  - Dashboard par élection
  
- ✅ **Validation des votes**
  - Approbation ou rejet
  - Génération automatique des PDFs M2
  - Transfert sécurisé au DE
  
- 📊 **Statistiques**
  - Votes en attente
  - Votes approuvés
  - Votes rejetés

### 🔓 DE (Centre de Dépouillement)

- 🔐 **Dépouillement anonyme**
  - Déchiffrement M2 (bulletin uniquement)
  - Aucun accès à l'identité
  - Interface de comptabilisation
  
- ✅ **Comptabilisation**
  - Vote par vote
  - Validation avant comptabilisation
  - Résultats en temps réel
  
- 🏆 **Résultats**
  - Classement automatique
  - Calcul des pourcentages
  - Statistiques détaillées

---

## 🛠️ Technologies

### Backend

| Technologie | Version | Utilité |
|------------|---------|---------|
| **Django** | 6.0.2 | Framework web Python |
| **Django REST Framework** | 3.16.1 | API REST |
| **SimpleJWT** | 5.5.1 | Authentification JWT |
| **PGPy** | 0.6.0 | Cryptographie OpenPGP |
| **ReportLab** | 4.2.5 | Génération PDF |
| **Channels** | 4.0.0 | WebSockets (temps réel) |
| **Redis** | 5.0.0 | Cache & message broker |
| **Pillow** | 12.1.0 | Traitement d'images |

### Frontend

| Technologie | Utilité |
|------------|---------|
| **React 18** | Framework UI |
| **Vite** | Build tool ultra-rapide |
| **React Router v6** | Navigation SPA |
| **Axios** | Client HTTP |
| **Lucide React** | Icônes modernes |
| **OpenPGP.js** | Cryptographie côté client |

### Base de données

- **SQLite** (développement)
- **PostgreSQL** (production recommandée)

---

## 📦 Installation

### Prérequis

Avant de commencer, assurez-vous d'avoir installé:

- ✅ Python 3.11 ou supérieur
- ✅ Node.js 18 ou supérieur
- ✅ Redis Server
- ✅ Git

### 🚀 Installation rapide

#### 1️⃣ Cloner le projet
```bash
git clone https://github.com/votre-username/evote-secure.git
cd evote-secure
```

#### 2️⃣ Configuration du Backend
```bash
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos configurations

# Créer les dossiers nécessaires
mkdir -p media/candidate_photos
mkdir -p media/votes/m2_pdfs

# Appliquer les migrations
python manage.py makemigrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

#### 3️⃣ Configuration du Frontend
```bash
cd frontend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec l'URL de votre backend

# Lancer le serveur de développement
npm run dev
```

#### 4️⃣ Démarrer Redis
```bash
# Windows (WSL ou Redis pour Windows)
redis-server

# Linux
sudo systemctl start redis
sudo systemctl enable redis

# Mac (avec Homebrew)
brew services start redis
```

---

## ⚙️ Configuration

### Backend - `.env`

Créer un fichier `.env` dans le dossier `backend/`:
```env
# Django
SECRET_KEY=votre-clé-secrète-ultra-sécurisée-ici
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite par défaut)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Email Configuration (Gmail)
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-application

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend - `.env`

Créer un fichier `.env` dans le dossier `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🚀 Utilisation

### Démarrage du système

1. **Démarrer Redis** (dans un terminal):
```bash
redis-server
```

2. **Démarrer le backend** (dans un autre terminal):
```bash
cd backend
python manage.py runserver
```

3. **Démarrer le frontend** (dans un troisième terminal):
```bash
cd frontend
npm run dev
```

### Accès aux interfaces

- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Django Admin**: http://127.0.0.1:8000/admin
- 📡 **API Root**: http://127.0.0.1:8000/api/

### Créer les utilisateurs de test

**Via Django Admin** (http://127.0.0.1:8000/admin):

1. **Administrateur** (déjà créé avec `createsuperuser`)
   - Role: `admin`

2. **Centre de Comptage (CO)**
   - Username: `co_user`
   - Role: `co`

3. **Centre de Dépouillement (DE)**
   - Username: `de_user`
   - Role: `de`

4. **Votants**
   - Créer via l'interface admin
   - Role: `voter`

---

## 🗳️ Workflow de vote

### Phase 1: Préparation (Administrateur)

1. **Créer une élection**
   - Titre, description
   - Dates de début et fin
   - Génération automatique des clés PGP

2. **Ajouter des candidats**
   - Nom, photo
   - Profession, description
   - Association à l'élection

3. **Configurer les électeurs**
   - Inviter par email
   - Valider les inscriptions
   - Assigner à l'élection

4. **Ouvrir le vote**
   - Vérification finale
   - Ouverture manuelle ou automatique
   - Notification aux électeurs

### Phase 2: Vote (Électeur)

1. **Connexion**
   - Login avec identifiants

2. **Sélection de l'élection**
   - Liste des élections actives

3. **Choix du candidat**
   - Voir photos et descriptions
   - Sélection du candidat

4. **Chiffrement et soumission**
   - Le système génère automatiquement:
     - **M1** (identité) → Chiffré avec clé publique CO
     - **M2** (bulletin) → Chiffré avec clé publique DE
     - **linking_id** → UUID unique liant M1 et M2
   - Soumission sécurisée

5. **Reçu de vote**
   - Code unique de vérification
   - Horodatage
   - Statut: `pending_co`

### Phase 3: Vérification (CO)

1. **Consultation des votes**
   - Dashboard par élection
   - Liste des votes en attente

2. **Vérification d'identité**
   - Déchiffrement de M1 uniquement
   - Affichage de l'identité du votant
   - **Important**: Le CO ne voit PAS le vote

3. **Décision**
   - **Approuver**:
     - Génération automatique du PDF M2
     - Changement de statut → `pending_de`
     - Transfert au DE
   - **Rejeter**:
     - Statut → `rejected_co`
     - Le votant peut revoter

### Phase 4: Dépouillement (DE)

1. **Consultation des votes approuvés**
   - Dashboard par élection
   - Liste des M2 chiffrés

2. **Déchiffrement du bulletin**
   - Déchiffrement de M2 uniquement
   - Affichage du candidat choisi
   - **Important**: Le DE ne connaît PAS l'identité

3. **Comptabilisation**
   - Validation du vote
   - Ajout au décompte
   - Statut → `counted`

### Phase 5: Résultats (Administrateur)

1. **Fermeture de l'élection**
   - Automatique ou manuelle
   - Fin du vote

2. **Consultation des résultats**
   - Classement des candidats
   - Graphiques et statistiques
   - Taux de participation

3. **Export PDF**
   - Gagnant en haut
   - Tableau détaillé avec photos
   - Statistiques complètes

4. **Publication** (optionnel)
   - Rendre les résultats publics
   - Accessible aux votants

---

## 🔒 Sécurité

### Principe du double chiffrement

Le système utilise **deux messages chiffrés indépendants**:
```
┌─────────────────────────────────────────────┐
│              VOTE DU CITOYEN                │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│      M1      │  │      M2      │
│  (Identité)  │  │  (Bulletin)  │
├──────────────┤  ├──────────────┤
│ • voter_id   │  │ • candidate  │
│ • name       │  │ • linking_id │
│ • email      │  │              │
│ • linking_id │  │ Chiffré avec:│
│              │  │ Clé PUB DE   │
│ Chiffré avec:│  └──────────────┘
│ Clé PUB CO   │
└──────────────┘
```

### Séparation des responsabilités

| Acteur | Accès M1 | Accès M2 | Connaît identité | Connaît vote |
|--------|----------|----------|------------------|--------------|
| **Votant** | ✅ Génère | ✅ Génère | ✅ Oui | ✅ Oui |
| **CO** | ✅ Déchiffre | ❌ Non | ✅ Oui | ❌ Non |
| **DE** | ❌ Non | ✅ Déchiffre | ❌ Non | ✅ Oui |
| **Admin** | ❌ Non | ❌ Non | ❌ Non | ❌ Non |

### Intégrité cryptographique

Le **linking_id** assure l'intégrité:
```python
linking_id = UUID4()  # Exemple: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

M1 contient: { ..., "linking_id": "a1b2c3d4-..." }
M2 contient: { ..., "linking_id": "a1b2c3d4-..." }

# Le système vérifie que M1.linking_id == M2.linking_id
# Sans jamais révéler l'identité au DE
```

### Génération des clés PGP

- **Algorithme**: RSA 4096 bits
- **Génération**: Automatique à la création de l'élection
- **Stockage**: Base de données chiffrée
- **Accès**: Restreint par rôle
- **Rotation**: Une paire de clés par élection

---

## 📁 Structure du projet
```
evote-secure/
│
├── backend/                          # Backend Django
│   ├── authentication/               # Gestion utilisateurs & JWT
│   │   ├── models.py                 # User, Invitation
│   │   ├── views.py                  # Login, Register, etc.
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── elections/                    # Gestion élections
│   │   ├── models.py                 # Election
│   │   ├── views.py                  # CRUD, Open/Close
│   │   ├── utils.py                  # Génération clés PGP
│   │   └── urls.py
│   │
│   ├── candidates/                   # Gestion candidats
│   │   ├── models.py                 # Candidate
│   │   ├── views.py                  # CRUD candidats
│   │   └── urls.py
│   │
│   ├── votes/                        # Système de vote
│   │   ├── models.py                 # Vote, DecryptedBallot
│   │   ├── views.py                  # Submit, CO, DE
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── results/                      # Résultats
│   │   ├── models.py                 # ElectionResult
│   │   ├── views.py                  # Calcul, Export PDF
│   │   └── urls.py
│   │
│   ├── evote_project/                # Configuration Django
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── media/                        # Fichiers uploadés
│   │   ├── candidate_photos/         # Photos candidats
│   │   └── votes/m2_pdfs/            # PDFs M2 générés
│   │
│   ├── requirements.txt              # Dépendances Python
│   ├── manage.py
│   └── .env                          # Configuration (à créer)
│
├── frontend/                         # Frontend React
│   ├── src/
│   │   ├── components/               # Composants réutilisables
│   │   │   └── ui/                   # Button, Card, Input, etc.
│   │   │
│   │   ├── contexts/                 # Contextes React
│   │   │   ├── AuthContext.jsx       # Authentification
│   │   │   └── NotificationContext.jsx
│   │   │
│   │   ├── pages/                    # Pages par rôle
│   │   │   ├── Admin/                # Dashboard admin
│   │   │   │   ├── AdminDashboardPage.jsx
│   │   │   │   ├── ElectionsPage.jsx
│   │   │   │   ├── CandidatesPage.jsx
│   │   │   │   ├── VotersPage.jsx
│   │   │   │   └── ResultsPage.jsx
│   │   │   │
│   │   │   ├── CO/                   # Dashboard CO
│   │   │   │   └── CODashboardPage.jsx
│   │   │   │
│   │   │   ├── DE/                   # Dashboard DE
│   │   │   │   └── DEDashboardPage.jsx
│   │   │   │
│   │   │   ├── Voter/                # Interface votant
│   │   │   │   ├── VoterDashboardPage.jsx
│   │   │   │   └── VotingPage.jsx
│   │   │   │
│   │   │   └── LoginPage.jsx         # Page de connexion
│   │   │
│   │   ├── services/                 # Services API
│   │   │   └── api.js                # Axios + endpoints
│   │   │
│   │   ├── utils/                    # Utilitaires
│   │   │   └── crypto.js             # Fonctions PGP
│   │   │
│   │   ├── App.jsx                   # Composant principal
│   │   └── main.jsx                  # Point d'entrée
│   │
│   ├── public/
│   │   └── logo.png                  # Logo de l'application
│   │
│   ├── package.json                  # Dépendances npm
│   ├── vite.config.js                # Config Vite
│   └── .env                          # Configuration (à créer)
│
├── .gitignore                        # Fichiers ignorés par Git
├── README.md                         # Ce fichier
└── LICENSE                           # Licence MIT
```

---

## 📡 API Documentation

### Authentification
```http
POST   /api/auth/login/
POST   /api/auth/register/
POST   /api/auth/logout/
GET    /api/auth/me/
POST   /api/auth/change-password/
GET    /api/auth/users/
POST   /api/auth/invitations/
```

### Élections
```http
GET    /api/elections/
POST   /api/elections/
GET    /api/elections/{id}/
PUT    /api/elections/{id}/
DELETE /api/elections/{id}/
POST   /api/elections/{id}/open/
POST   /api/elections/{id}/close/
GET    /api/elections/{id}/public_keys/
GET    /api/elections/{id}/private_keys/
POST   /api/elections/assign-voters/
GET    /api/elections/{id}/voters/
```

### Candidats
```http
GET    /api/candidates/
POST   /api/candidates/
GET    /api/candidates/{id}/
PUT    /api/candidates/{id}/
DELETE /api/candidates/{id}/
GET    /api/candidates/election/{election_id}/
```

### Votes
```http
# Votant
POST /api/votes/submit/
GET  /api/votes/my-vote/?election_id={id}
GET  /api/votes/receipt/?code={code}

# CO (Centre de Comptage)
GET  /api/votes/co/election/{election_id}/
POST /api/votes/co/approve/
POST /api/votes/co/reject/
GET  /api/votes/co/{vote_id}/download-m2/

# DE (Centre de Dépouillement)
GET  /api/votes/de/pending/?election_id={id}
POST /api/votes/de/decrypt/
GET  /api/votes/de/results/{election_id}/

# Téléchargements
GET  /api/votes/{vote_id}/download-m1/
GET  /api/votes/{vote_id}/download-m2/
```

### Résultats
```http
GET  /api/results/
GET  /api/results/{election_id}/
GET  /api/results/{election_id}/export-pdf/
POST /api/results/calculate/{election_id}/
POST /api/results/publish/{election_id}/
```


---

## 🧪 Tests

### Backend
```bash
cd backend

# Lancer tous les tests
python manage.py test

# Tests d'une app spécifique
python manage.py test votes

# Avec coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend
```bash
cd frontend

# Lancer les tests
npm run test

# Mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 🚀 Déploiement

### Production avec Docker
```bash
# Build
docker-compose build

# Lancer
docker-compose up -d

# Migrations
docker-compose exec backend python manage.py migrate

# Créer superuser
docker-compose exec backend python manage.py createsuperuser
```

### Variables d'environnement (Production)
```env
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com
SECRET_KEY=clé-ultra-sécurisée-générée
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 🎉

### Comment contribuer

1. **Fork** le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une **Pull Request**

### Code Style

- **Python**: PEP 8
- **JavaScript**: ESLint + Prettier
- **Commits**: Messages clairs en français
- **Tests**: Obligatoires pour les nouvelles fonctionnalités

### Signaler un bug

Ouvrez une [issue](https://github.com/votre-username/evote-secure/issues) avec:
- Description du bug
- Étapes pour reproduire
- Comportement attendu vs actuel
- Screenshots si possible

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
```
MIT License

Copyright (c) 2026 Vote Électronique Sécurisé

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👥 Auteurs

- **Safa AKDID ** -  - [GitHub](https://github.com/akdiidsafa)
- **Hasna CHALLA ** -  - [GitHub](https://github.com/HasnaChalla)
- **Abderrahmane FARROUG ** -  - [GitHub](https://github.com/FarrougAbderrahmane)



---

## 🙏 Remerciements

- [PGPy](https://github.com/SecurityInnovation/PGPy) pour la cryptographie OpenPGP
- [Django](https://www.djangoproject.com/) pour le framework backend robuste
- [React](https://react.dev/) pour l'interface utilisateur moderne
- [ReportLab](https://www.reportlab.com/) pour la génération de PDFs professionnels
- [Vite](https://vitejs.dev/) pour le build ultra-rapide

---
## 🔗 Liens utiles

- [Documentation Django](https://docs.djangoproject.com/)
- [Documentation React](https://react.dev/)
- [OpenPGP.js](https://openpgpjs.org/)
- [Guide de sécurité](docs/SECURITY.md)
- [Changelog](CHANGELOG.md)

---


