from google.cloud import texttospeech
from pydub import AudioSegment
import os


def generate_audio(text: str, output_filepath: str, voice_name: str, lang_code: str) -> None:
    """
    Generates an MP3 audio file from the given text using Google Cloud Text-to-Speech.

    Args:
        text: The text to convert to audio.
        output_filepath: The path to the MP3 file to create.
        voice_name: The name of the voice to use.
        lang_code: The language code.
    """
    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice_params = texttospeech.VoiceSelectionParams(
        language_code=lang_code,
        name=voice_name
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice_params,
        audio_config=audio_config
    )

    with open(output_filepath, "wb") as out:
        out.write(response.audio_content)
        print(f"Audio generated to {output_filepath}")

def merge_audio_files(input_filepaths: list, output_filepath: str) -> None:
    """
    Merges a list of MP3 audio files into a single MP3 file.

    Args:
        input_filepaths: A list of file paths to the MP3 files to merge.
        output_filepath: The path to the output merged MP3 file.
    """
    merged_audio = AudioSegment.empty()
    for filepath in input_filepaths:
        try:
            audio_segment = AudioSegment.from_mp3(filepath)
            merged_audio += audio_segment
        except Exception as e:
            print(f"Error merging audio file {filepath}: {e}")

    try:
        merged_audio.export(output_filepath, format="mp3")
        print(f"Merged audio exported to {output_filepath}")
    except Exception as e:
        print(f"Error exporting merged audio: {e}")