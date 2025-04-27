import os

# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
VERTEX_AI_LOCATION = os.getenv("VERTEX_AI_LOCATION")

# Text-to-Speech Voice Configuration
WOMEN_VOICE = "fr-FR-Wavenet-C"  
MAN_VOICE = "fr-FR-Wavenet-B"  
LANGUAGE_CODE = "fr-FR"

# File Paths
UPLOADS_DIR = 'uploads'
AUDIO_DIR = 'podcast_generated'
