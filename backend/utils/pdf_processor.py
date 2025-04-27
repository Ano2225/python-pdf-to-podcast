from PyPDF2 import PdfReader

def extract_text_from_pdf(pdf_filepath: str) -> str:
    """
    Extracts text from a PDF file.

    Args:
        pdf_filepath: The path to the PDF file.

    Returns:
        The extracted text from the PDF, or an empty string if an error occurs.
    """
    text = ""
    try:
        reader = PdfReader(pdf_filepath)
        for page in reader.pages:
            text += page.extract_text()
    except Exception as e:
        print(f"Error during PDF text extraction: {e}")
    return text

