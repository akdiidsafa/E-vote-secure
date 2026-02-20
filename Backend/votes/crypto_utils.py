
"""
Module de chiffrement OpenPGP pour le système de vote électronique
Utilise GnuPG via python-gnupg (RFC 4880 - OpenPGP Message Format)
"""

import gnupg
import os
from django.conf import settings

# Créer le répertoire GPG s'il n'existe pas
GPG_HOME = os.path.join(settings.BASE_DIR, '.gnupg')
os.makedirs(GPG_HOME, exist_ok=True)

# FORCER l'utilisation de Gpg4win (pas Git Bash GPG)
GPG_BINARY = None
if os.name == 'nt':  # Windows uniquement
    possible_paths = [
        'C:\\Program Files (x86)\\GnuPG\\bin\\gpg.exe',
        'C:\\Program Files\\GnuPG\\bin\\gpg.exe',
        'C:\\Program Files (x86)\\Gpg4win\\bin\\gpg.exe',
        'C:\\Program Files\\Gpg4win\\bin\\gpg.exe',
    ]
    for path in possible_paths:
        if os.path.exists(path):
            GPG_BINARY = path
            break

if not GPG_BINARY:
    raise RuntimeError(
        "Gpg4win n'est pas installé. Téléchargez-le depuis: https://gpg4win.org/download.html"
    )

print(f"📂 GPG Home: {GPG_HOME}")
print(f"🔧 GPG Binary: {GPG_BINARY}")

# Créer un fichier de configuration GPG pour désactiver l'agent
gpg_conf_path = os.path.join(GPG_HOME, 'gpg.conf')
gpg_agent_conf_path = os.path.join(GPG_HOME, 'gpg-agent.conf')

# Configuration GPG (désactiver l'agent)
with open(gpg_conf_path, 'w') as f:
    f.write('# Configuration automatique pour evote\n')
    f.write('use-agent\n')
    f.write('pinentry-mode loopback\n')

# Configuration gpg-agent (permettre loopback pinentry)
with open(gpg_agent_conf_path, 'w') as f:
    f.write('# Configuration automatique pour evote\n')
    f.write('allow-loopback-pinentry\n')
    f.write('max-cache-ttl 0\n')

print(f"✅ Configuration GPG créée")

# Initialiser GPG avec options spéciales
gpg = gnupg.GPG(
    gnupghome=GPG_HOME,
    gpgbinary=GPG_BINARY,
    options=[
        '--pinentry-mode', 'loopback',
        '--batch',
        '--yes',
        '--passphrase', ''
    ]
)
gpg.encoding = 'utf-8'

print(f"✅ GPG Version: {gpg.version}")


def generate_keypair(name, email):
    """
    Génère une paire de clés OpenPGP (RSA 2048 bits)
    Conforme à la RFC 4880 (OpenPGP Message Format)
    
    Args:
        name (str): Nom du propriétaire de la clé (ex: "CO Election 10")
        email (str): Email associé à la clé
    
    Returns:
        dict: {
            'fingerprint': str,
            'public_key': str (format ASCII-armored OpenPGP),
            'private_key': str (format ASCII-armored OpenPGP)
        }
    """
    print(f"  📝 Génération de clé OpenPGP pour {name} <{email}>")
    
    # Générer la clé RSA 2048 bits
    input_data = gpg.gen_key_input(
        name_real=name,
        name_email=email,
        key_type='RSA',
        key_length=2048,
        passphrase='',  # Pas de passphrase
        expire_date=0,  # Pas d'expiration
    )
    
    # Générer la clé
    key = gpg.gen_key(input_data)
    fingerprint = str(key)
    
    # Déboguer si échec
    if not fingerprint:
        print(f"  ❌ ÉCHEC - Fingerprint vide")
        print(f"  ❌ Status: {key.status}")
        print(f"  ❌ Stderr: {key.stderr}")
        
        raise RuntimeError(
            f"Échec de la génération de clé OpenPGP.\n"
            f"Status: {key.status}\n"
            f"Stderr: {key.stderr}"
        )
    
    # Exporter la clé publique (format ASCII-armored)
    public_key = gpg.export_keys(fingerprint)
    
    if not public_key:
        raise RuntimeError(f"Échec de l'export de la clé publique")
    
    # Exporter la clé privée (format ASCII-armored)
    private_key = gpg.export_keys(
        fingerprint,
        secret=True,
        passphrase=''
    )
    
    if not private_key:
        raise RuntimeError(f"Échec de l'export de la clé privée")
    
    print(f"  ✅ Clé OpenPGP générée (fingerprint: {fingerprint[:16]}...)")
    
    return {
        'fingerprint': fingerprint,
        'public_key': public_key,
        'private_key': private_key
    }


def encrypt_message(message, public_key):
    """
    Chiffre un message avec une clé publique OpenPGP
    
    Args:
        message (str): Message à chiffrer (format texte ou JSON stringifié)
        public_key (str): Clé publique OpenPGP au format ASCII-armored
    
    Returns:
        str: Message chiffré au format ASCII-armored OpenPGP
    
    Raises:
        ValueError: Si le chiffrement échoue
    """
    if not message or not public_key:
        raise ValueError("Message et clé publique requis")
    
    # Importer la clé publique OpenPGP
    import_result = gpg.import_keys(public_key)
    
    if not import_result.fingerprints:
        raise ValueError("Impossible d'importer la clé publique OpenPGP")
    
    fingerprint = import_result.fingerprints[0]
    
    # Chiffrer avec OpenPGP
    encrypted = gpg.encrypt(
        message,
        fingerprint,
        always_trust=True,
        armor=True  # Format ASCII-armored (standard OpenPGP)
    )
    
    if not encrypted.ok:
        raise ValueError(f"Échec du chiffrement OpenPGP: {encrypted.status}")
    
    return str(encrypted)

def decrypt_message(encrypted_message, private_key):
    """
    Déchiffre un message avec une clé privée OpenPGP
    Utilise subprocess car python-gnupg a des problèmes sur Windows
    
    Args:
        encrypted_message (str): Message chiffré au format ASCII-armored OpenPGP
        private_key (str): Clé privée OpenPGP au format ASCII-armored
    
    Returns:
        str: Message déchiffré (texte brut)
    
    Raises:
        ValueError: Si le déchiffrement échoue
    """
    import subprocess
    import tempfile
    import os
    
    if not encrypted_message or not private_key:
        raise ValueError("Message chiffré et clé privée requis")
    
    # Importer la clé privée OpenPGP dans le keyring
    import_result = gpg.import_keys(private_key)
    
    if not import_result.fingerprints:
        raise ValueError("Impossible d'importer la clé privée OpenPGP")
    
    fingerprint = import_result.fingerprints[0]
    print(f"  🔑 Clé privée importée: {fingerprint[:16]}...")
    
    # Créer un fichier temporaire pour le message
    temp_dir = tempfile.gettempdir()
    temp_file = os.path.join(temp_dir, f'pgp_message_{os.getpid()}.asc')
    
    try:
        # Écrire le message chiffré dans le fichier temporaire
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(encrypted_message)
        
        # Déchiffrer avec GPG via subprocess
        result = subprocess.run(
            [GPG_BINARY,
             '--homedir', GPG_HOME,
             '--pinentry-mode', 'loopback',
             '--batch',
             '--yes',
             '--passphrase', '',
             '--decrypt',
             temp_file],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            print(f"  ❌ GPG stderr: {result.stderr}")
            raise ValueError(f"Échec du déchiffrement OpenPGP (code {result.returncode})")
        
        decrypted_text = result.stdout.strip()
        
        if not decrypted_text:
            raise ValueError("Déchiffrement réussi mais message vide")
        
        print(f"  ✅ Déchiffrement réussi ({len(decrypted_text)} chars)")
        
        return decrypted_text
        
    finally:
        # Supprimer le fichier temporaire
        try:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
        except Exception as e:
            print(f"  ⚠️ Impossible de supprimer {temp_file}: {e}")