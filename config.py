import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    # Use system temp directory for uploads and outputs
    TEMP_BASE = tempfile.gettempdir()
    UPLOAD_FOLDER = os.path.join(TEMP_BASE, 'markdown_to_pdf_uploads')
    OUTPUT_FOLDER = os.path.join(TEMP_BASE, 'markdown_to_pdf_outputs')
    ALLOWED_EXTENSIONS = {'md', 'txt', 'markdown'}
    PANDOC_PATH = os.environ.get('PANDOC_PATH', 'pandoc')  # Can be set via environment variable
    MIKTEX_BIN_DIR = os.environ.get('MIKTEX_BIN_DIR', '')  # MiKTeX bin directory for LaTeX engines