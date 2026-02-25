import os
import uuid
import logging
from flask import Blueprint, render_template, request, jsonify, send_file, redirect, url_for, flash
from werkzeug.utils import secure_filename
from config import Config
from utils import allowed_file, convert_markdown_to_pdf, convert_markdown_text_to_pdf, cancel_conversion

# Setup logging
logger = logging.getLogger(__name__)

# Create Blueprint
main = Blueprint('main', __name__)


def ensure_directories():
    """Ensure upload and output directories exist."""
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)


@main.route('/')
def index():
    """Render main page."""
    return render_template('index.html')


@main.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and conversion."""
    ensure_directories()

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename, Config.ALLOWED_EXTENSIONS):
        return jsonify({'error': 'File type not allowed. Please upload .md, .txt, or .markdown files.'}), 400

    # Get conversion parameters from form
    pdf_engine = request.form.get('pdf_engine') or 'xelatex'
    document_class = request.form.get('document_class') or 'article'
    geometry = request.form.get('geometry') or 'margin=1in'
    fontsize = request.form.get('fontsize') or '12pt'
    mainfont = request.form.get('mainfont', '')
    linestretch = request.form.get('linestretch', '')
    colorlinks = request.form.get('colorlinks', 'true') == 'true'
    number_sections = request.form.get('number_sections', 'false') == 'true'
    toc = request.form.get('toc', 'false') == 'true'

    language = request.form.get('language', '')
    cjk_mainfont = request.form.get('cjk_mainfont', '')
    cjk_sansfont = request.form.get('cjk_sansfont', '')
    cjk_monofont = request.form.get('cjk_monofont', '')
    east_asian_line_breaks = request.form.get('east_asian_line_breaks', 'false') == 'true'
    request_id = request.form.get('request_id', None)
    # Save uploaded file
    filename = secure_filename(file.filename)
    unique_id = str(uuid.uuid4())[:8]
    input_filename = f"{unique_id}_{filename}"
    input_path = os.path.join(Config.UPLOAD_FOLDER, input_filename)
    file.save(input_path)

    # Generate output filename
    output_filename = f"{unique_id}_{os.path.splitext(filename)[0]}.pdf"
    output_path = os.path.join(Config.OUTPUT_FOLDER, output_filename)

    # Convert to PDF
    success, message = convert_markdown_to_pdf(
        input_path=input_path,
        output_path=output_path,
        pdf_engine=pdf_engine,
        document_class=document_class,
        geometry=geometry,
        fontsize=fontsize,
        mainfont=mainfont if mainfont else None,
        linestretch=linestretch if linestretch else None,
        colorlinks=colorlinks,
        number_sections=number_sections,
        toc=toc,
        language=language,
        cjk_mainfont=cjk_mainfont if cjk_mainfont else None,
        cjk_sansfont=cjk_sansfont if cjk_sansfont else None,
        cjk_monofont=cjk_monofont if cjk_monofont else None,
        east_asian_line_breaks=east_asian_line_breaks,
        request_id=request_id
    )

    if not success:
        # Clean up uploaded file
        try:
            os.remove(input_path)
        except:
            pass
        return jsonify({'error': message}), 500

    return jsonify({
        'success': True,
        'message': 'Conversion successful',
        'download_url': url_for('main.download_file', filename=output_filename)
    })


@main.route('/convert-text', methods=['POST'])
def convert_text():
    """Convert markdown text to PDF."""
    ensure_directories()

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    markdown_text = data['text']

    # Get conversion parameters
    pdf_engine = data.get('pdf_engine') or 'xelatex'
    document_class = data.get('document_class') or 'article'
    geometry = data.get('geometry') or 'margin=1in'
    fontsize = data.get('fontsize') or '12pt'
    mainfont = data.get('mainfont', '')
    linestretch = data.get('linestretch', '')
    colorlinks = data.get('colorlinks', True)
    number_sections = data.get('number_sections', False)
    toc = data.get('toc', False)

    language = data.get('language', '')
    cjk_mainfont = data.get('cjk_mainfont', '')
    cjk_sansfont = data.get('cjk_sansfont', '')
    cjk_monofont = data.get('cjk_monofont', '')
    east_asian_line_breaks = data.get('east_asian_line_breaks', False)
    request_id = data.get('request_id', None)

    # Generate unique filename
    unique_id = str(uuid.uuid4())[:8]
    output_filename = f"{unique_id}_converted.pdf"
    output_path = os.path.join(Config.OUTPUT_FOLDER, output_filename)

    # Convert text to PDF
    success, message = convert_markdown_text_to_pdf(
        markdown_text=markdown_text,
        output_path=output_path,
        request_id=request_id,
        pdf_engine=pdf_engine,
        document_class=document_class,
        geometry=geometry,
        fontsize=fontsize,
        mainfont=mainfont if mainfont else None,
        linestretch=linestretch if linestretch else None,
        colorlinks=colorlinks,
        number_sections=number_sections,
        toc=toc,
        language=language,
        cjk_mainfont=cjk_mainfont if cjk_mainfont else None,
        cjk_sansfont=cjk_sansfont if cjk_sansfont else None,
        cjk_monofont=cjk_monofont if cjk_monofont else None,
        east_asian_line_breaks=east_asian_line_breaks
    )

    if not success:
        return jsonify({'error': message}), 500

    return jsonify({
        'success': True,
        'message': 'Conversion successful',
        'download_url': url_for('main.download_file', filename=output_filename)
    })


@main.route('/cancel', methods=['POST'])
def cancel_conversion_route():
    """Cancel a running conversion by request_id."""
    data = request.get_json()
    if not data or 'request_id' not in data:
        return jsonify({'error': 'No request_id provided'}), 400

    request_id = data['request_id']
    success = cancel_conversion(request_id)

    if success:
        return jsonify({'success': True, 'message': f'Conversion {request_id} cancelled'})
    else:
        return jsonify({'success': False, 'message': f'No running conversion found for {request_id}'}), 404


@main.route('/download/<filename>')
def download_file(filename):
    """Download converted PDF file."""
    ensure_directories()
    file_path = os.path.join(Config.OUTPUT_FOLDER, filename)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    return send_file(file_path, as_attachment=True, download_name=filename)


@main.route('/api/config-presets')
def config_presets():
    """Get available configuration presets."""
    presets = {
        'academic': {
            'name': 'Academic Paper',
            'pdf_engine': 'xelatex',
            'document_class': 'article',
            'geometry': 'a4paper,margin=2.5cm',
            'fontsize': '11pt',
            'mainfont': 'TeX Gyre Termes',
            'linestretch': '1.25',
            'colorlinks': True,
            'number_sections': True,
            'toc': False
        },
        'simple': {
            'name': 'Simple Document',
            'pdf_engine': 'xelatex',
            'document_class': 'article',
            'geometry': 'margin=1in',
            'fontsize': '12pt',
            'mainfont': '',
            'linestretch': '',
            'colorlinks': True,
            'number_sections': False,
            'toc': False
        },
        'book': {
            'name': 'Book Style',
            'pdf_engine': 'xelatex',
            'document_class': 'book',
            'geometry': 'margin=1.5in',
            'fontsize': '12pt',
            'mainfont': '',
            'linestretch': '1.5',
            'colorlinks': False,
            'number_sections': True,
            'toc': True
        },
        'chinese': {
            'name': 'Chinese Document',
            'pdf_engine': 'xelatex',
            'document_class': 'ctexart',
            'geometry': 'a4paper,margin=2cm',
            'fontsize': '12pt',
            'mainfont': '',
            'linestretch': '',
            'colorlinks': True,
            'number_sections': False,
            'toc': False,
            'language': 'zh',
            'cjk_mainfont': 'SimSun',
            'cjk_sansfont': '',
            'cjk_monofont': '',
            'east_asian_line_breaks': True
        },
        'japanese': {
            'name': 'Japanese Document',
            'pdf_engine': 'xelatex',
            'document_class': 'article',
            'geometry': 'a4paper,margin=2cm',
            'fontsize': '12pt',
            'mainfont': '',
            'linestretch': '',
            'colorlinks': True,
            'number_sections': False,
            'toc': False,
            'language': 'ja',
            'cjk_mainfont': 'MS Mincho',
            'cjk_sansfont': 'MS Gothic',
            'cjk_monofont': '',
            'east_asian_line_breaks': True
        },
        'korean': {
            'name': 'Korean Document',
            'pdf_engine': 'xelatex',
            'document_class': 'article',
            'geometry': 'a4paper,margin=2cm',
            'fontsize': '12pt',
            'mainfont': '',
            'linestretch': '',
            'colorlinks': True,
            'number_sections': False,
            'toc': False,
            'language': 'ko',
            'cjk_mainfont': 'Batang',
            'cjk_sansfont': 'Dotum',
            'cjk_monofont': '',
            'east_asian_line_breaks': True
        }
    }
    return jsonify(presets)