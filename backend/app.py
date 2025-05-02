from flask import Flask, request, jsonify,send_from_directory
import os
from dotenv import load_dotenv
import datetime
import config
from utils.pdf_processor import extract_text_from_pdf
from utils.audio_processor import generate_audio, merge_audio_files

# Import Vertex AI libraries for generative models
from vertexai.preview.generative_models import GenerativeModel, Part
from google.cloud import texttospeech
import vertexai

load_dotenv()

app = Flask(__name__)

# Get Google Cloud project and location from environment variables
project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
location = os.getenv("VERTEX_AI_LOCATION")

if not project_id or not location:
    print("Error: Google Cloud Project ID or Location not found in environment variables.")
    print("Please make sure you have a .env file in the backend directory with GOOGLE_CLOUD_PROJECT and VERTEX_AI_LOCATION defined.")
    exit()

# Configure your Google Cloud project and location for Vertex AI
try:
    vertexai.init(project=project_id, location=location)
except Exception as e:
    print(f"Error initializing Vertex AI: {e}")
    print("Please ensure your Google Cloud project ID and location are correct and you have the necessary permissions.")
    exit()

try:
    generation_model = GenerativeModel("gemini-1.5-flash-002")
except Exception as e:
    print(f"Error loading the Generative Model: {e}")
    print("Please ensure the model name is correct and available in your specified location.")
    exit()

# Initialize Google Cloud Text-to-Speech client
text_to_speech_client = texttospeech.TextToSpeechClient()

voice_amina_name = config.WOMEN_VOICE
voice_david_name = config.MAN_VOICE
language_code = config.LANGUAGE_CODE

# Create 'uploads' and 'podcast_generated' folders if they don't exist
if not os.path.exists(config.UPLOADS_DIR):
    os.makedirs(config.UPLOADS_DIR)
if not os.path.exists(config.AUDIO_DIR):
    os.makedirs(config.AUDIO_DIR)

@app.route('/', methods=['GET'])
def hello():
    return "Hello everyone"

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'pdf_file' not in request.files:
        return jsonify({"error": "No 'pdf_file' part in the request"}), 400

    file = request.files['pdf_file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        # Save the uploaded file
        filename = file.filename
        filepath = os.path.join(config.UPLOADS_DIR, filename)
        file.save(filepath)

        # Extract text from the PDF
        extracted_text = extract_text_from_pdf(filepath)

        if extracted_text:
            # Generate dialogue using Vertex AI
            try:
                prompt = f"""
                À partir du texte suivant extrait du PDF, créez un court dialogue entre deux personnages.
                Le dialogue doit discuter du sujet principal du texte et des idées clés présentées.
                Le dialogue doit comporter environ 10 à 15 échanges (répliques).
                Donnez des noms aux deux personnages (par exemple, 'Amina' et 'David').
                Formatez le dialogue comme suit, avec le nom du personnage suivi de deux-points :

                Amina: ...
                David: ...
                Amina: ...
                David: ...
                ...

                ---
                Texte extrait du PDF :
                {extracted_text}
                ---

                Dialogue :
                Amina:
                """

                response = generation_model.generate_content(prompt)
                generated_dialogue = response.candidates[0].content.parts[0].text

                # Generate audio from the dialogue
                audio_file_paths = []
                lines = generated_dialogue.strip().split('\n')
                reply_number = 1
                for line in lines:
                    line = line.strip()
                    if line.startswith("Amina:"):
                        text_to_speak = line[len("Amina:"):].strip()
                        output_filename = f"amina_reply_{reply_number}.mp3"
                        output_filepath = os.path.join(config.AUDIO_DIR, output_filename)
                        generate_audio(text_to_speak, output_filepath, config.WOMEN_VOICE, config.LANGUAGE_CODE)
                        audio_file_paths.append(output_filepath)
                        reply_number += 1
                    elif line.startswith("David:"):
                        text_to_speak = line[len("David:"):].strip()
                        output_filename = f"david_reply_{reply_number}.mp3"
                        output_filepath = os.path.join(config.AUDIO_DIR, output_filename)
                        generate_audio(text_to_speak, output_filepath, config.MAN_VOICE, config.LANGUAGE_CODE)
                        audio_file_paths.append(output_filepath)
                        reply_number += 1

                # Generate a unique filename for the merged podcast
                unique_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
                merged_audio_filename = f"podcast_{unique_id}.mp3"
                merged_audio_output_path = os.path.join(config.AUDIO_DIR, merged_audio_filename)

                # Merge the generated audio files
                merge_audio_files(audio_file_paths, merged_audio_output_path)

                # --- Delete now audio files ---
                for filepath in audio_file_paths:
                    try:
                        os.remove(filepath)
                        print(f"Deleted individual audio file: {filepath}")
                    except Exception as e:
                        print(f"Error deleting individual audio file {filepath}: {e}")
                # --- END ---

                return jsonify({
                    "message": "PDF processed, dialogue generated, and merged podcast created",
                    "filename": filename,
                    "generated_dialogue": generated_dialogue,
                    "podcast_filename": merged_audio_filename
                }), 200

            except Exception as e:
                print(f"Error during dialogue or audio generation/merging: {e}")
                return jsonify({"error": f"Error during dialogue or audio generation/merging: {e}"}), 500
        else:
            return jsonify({"error": "Could not extract text from PDF"}), 500

    return jsonify({"error": "An unknown error occurred"}), 500


@app.route('/podcast_generated/<filename>')
def serve_podcast(filename):
    # Cette route sert les fichiers depuis le dossier 'podcast_generated'.
    # Nous utilisons un chemin absolu pour plus de robustesse.
    podcast_directory = os.path.join(app.root_path, config.AUDIO_DIR) # Utilisation de app.root_path
    print(f"Attempting to serve file: {filename} from directory: {podcast_directory}") # Ligne de débogage
    try:
        return send_from_directory(podcast_directory, filename)
    except Exception as e:
        print(f"Erreur lors du service du fichier {filename} depuis {podcast_directory}: {e}")
        return "Fichier non trouvé", 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
