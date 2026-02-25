import os
import logging
from flask import Flask
from config import Config


def create_app(config_class=Config):
    """Create and configure Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)

    # Ensure upload and output directories exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

    # Add MiKTeX bin directory to PATH if configured
    miktex_bin_dir = app.config.get('MIKTEX_BIN_DIR', '')
    if miktex_bin_dir and os.path.isdir(miktex_bin_dir):
        os.environ['PATH'] = miktex_bin_dir + os.pathsep + os.environ['PATH']
        logger.info(f"Added MiKTeX bin directory to PATH: {miktex_bin_dir}")

    # Register blueprints
    from routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    # Register error handlers
    register_error_handlers(app)

    return app


def register_error_handlers(app):
    """Register error handlers."""

    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return {'error': 'File too large'}, 413


# Create app instance for development
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=1204)