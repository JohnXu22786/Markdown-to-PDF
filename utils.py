import os
import subprocess
import tempfile
import shutil
import threading
from typing import Optional, Tuple
import logging
from config import Config

logger = logging.getLogger(__name__)

# Global dictionary to track running conversion processes
_processes = {}
_processes_lock = threading.Lock()


def allowed_file(filename: str, allowed_extensions: set) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def _register_process(key: str, process: subprocess.Popen):
    """Register a conversion process."""
    with _processes_lock:
        _processes[key] = process


def _unregister_process(key: str):
    """Unregister a conversion process."""
    with _processes_lock:
        _processes.pop(key, None)


def cancel_conversion(key: str) -> bool:
    """
    Cancel a running conversion by key (request_id or output_path).
    Returns True if process was found and terminated, False otherwise.
    """
    with _processes_lock:
        process = _processes.get(key)
        if process is None:
            return False

        try:
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
        except Exception as e:
            logger.error(f"Error canceling process {key}: {e}")
            return False
        finally:
            _processes.pop(key, None)

    logger.info(f"Cancelled conversion for {key}")
    return True


def convert_markdown_to_pdf(
    input_path: str,
    output_path: str,
    pdf_engine: str = 'xelatex',
    document_class: str = 'article',
    geometry: str = 'margin=1in',
    fontsize: str = '12pt',
    mainfont: Optional[str] = None,
    linestretch: Optional[str] = None,
    colorlinks: bool = True,
    number_sections: bool = False,
    toc: bool = False,
    language: str = '',
    cjk_mainfont: Optional[str] = None,
    cjk_sansfont: Optional[str] = None,
    cjk_monofont: Optional[str] = None,
    east_asian_line_breaks: bool = True,
    request_id: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Convert markdown file to PDF using pandoc.

    Returns (success, message).
    """
    try:
        # Build pandoc command
        cmd = [
            Config.PANDOC_PATH,
            input_path,
            '-o', output_path,
            '--pdf-engine', pdf_engine,
        ]

        # Handle document class - ensure not empty and auto-set ctexart for Chinese if default
        if not document_class:
            document_class = 'article'
        actual_document_class = document_class
        if language == 'zh' and document_class == 'article':
            actual_document_class = 'ctexart'

        cmd.extend(['-V', f'documentclass={actual_document_class}'])
        cmd.extend(['-V', f'geometry:{geometry}'])
        cmd.extend(['-V', f'fontsize={fontsize}'])

        if mainfont:
            cmd.extend(['-V', f'mainfont={mainfont}'])

        if linestretch:
            cmd.extend(['-V', f'linestretch={linestretch}'])

        if colorlinks:
            cmd.extend(['-V', 'colorlinks=true'])

        if number_sections:
            cmd.append('-N')

        if toc:
            cmd.append('--toc')

        # East Asian language support
        if east_asian_line_breaks:
            cmd.extend(['-f', 'markdown+east_asian_line_breaks'])

        if language:
            cmd.extend(['-V', f'lang={language}'])

        if cjk_mainfont:
            cmd.extend(['-V', f'CJKmainfont={cjk_mainfont}'])
        if cjk_sansfont:
            cmd.extend(['-V', f'CJKsansfont={cjk_sansfont}'])
        if cjk_monofont:
            cmd.extend(['-V', f'CJKmonofont={cjk_monofont}'])

        # Run pandoc with Popen to allow cancellation
        logger.info(f"Running pandoc command: {' '.join(cmd)}")
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )

        # Determine key for process tracking
        key = request_id if request_id is not None else output_path
        # Register process for potential cancellation
        _register_process(key, process)

        try:
            stdout, stderr = process.communicate(timeout=60)

            if process.returncode != 0:
                error_msg = f"Pandoc failed with return code {process.returncode}: {stderr}"
                logger.error(error_msg)
                return False, error_msg

            return True, "Conversion successful"

        except subprocess.TimeoutExpired:
            # Timeout - kill the process
            process.kill()
            process.wait()
            error_msg = "Pandoc conversion timed out after 60 seconds"
            logger.error(error_msg)
            return False, error_msg

        except Exception as e:
            # Other errors - ensure process is terminated
            if process.poll() is None:
                process.kill()
                process.wait()
            error_msg = f"Unexpected error during conversion: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

        finally:
            # Unregister process
            _unregister_process(key)

    except Exception as e:
        error_msg = f"Error during conversion setup: {str(e)}"
        logger.error(error_msg)
        return False, error_msg

def convert_markdown_text_to_pdf(
    markdown_text: str,
    output_path: str,
    request_id: Optional[str] = None,
    **kwargs
) -> Tuple[bool, str]:
    """Convert markdown text to PDF by writing to temp file."""
    try:
        # Get language from kwargs to determine encoding
        language = kwargs.get('language', '')

        # Determine encoding based on language
        # For East Asian languages, use UTF-8 with BOM to help pandoc detect encoding
        # Other languages use UTF-8 without BOM
        if language in ('zh', 'ja', 'ko'):
            encoding = 'utf-8-sig'  # UTF-8 with BOM
        else:
            encoding = 'utf-8'

        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding=encoding) as tmp:
            tmp.write(markdown_text)
            tmp_path = tmp.name

        # Pass request_id to the conversion function
        call_kwargs = kwargs.copy()
        call_kwargs['request_id'] = request_id
        success, message = convert_markdown_to_pdf(tmp_path, output_path, **call_kwargs)

        # Clean up temp file
        os.unlink(tmp_path)

        return success, message

    except Exception as e:
        error_msg = f"Error in text conversion: {str(e)}"
        logger.error(error_msg)
        return False, error_msg