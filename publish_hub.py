import http.server
import socketserver
import os
from pathlib import Path
from datetime import datetime

PORT = int(os.environ.get('PORT', 8000))
BASE_DIR = Path(__file__).parent.resolve()

class MissionControlHandler(http.server.SimpleHTTPRequestHandler):
    """Secure static file handler with proper security headers."""

    def log_message(self, format, *args):
        # Suppress default GET logs for cleaner output
        pass
        
    def end_headers(self):
        origin = self.headers.get('Origin', '')
        allowed_origins = [
            'http://localhost:8000',
            'http://127.0.0.1:8000',
            'https://xajodmjpwpvhrltdactf.supabase.co',
        ]

        if origin in allowed_origins or not origin:
            self.send_header('Access-Control-Allow-Origin', origin if origin else 'http://localhost:8000')
        else:
            self.send_header('Access-Control-Allow-Origin', 'null')

        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

        # Security Headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        self.send_header(
            'Content-Security-Policy',
            "default-src 'self'; "
            "script-src 'self' https://cdn.jsdelivr.net https://code.jquery.com 'unsafe-inline'; "
            "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; "
            "img-src 'self' https: data: blob:; "
            "font-src 'self' https://cdn.jsdelivr.net data:; "
            "connect-src 'self' https://xajodmjpwpvhrltdactf.supabase.co https://api.open-notify.org; "
            "frame-src 'self';"
        )
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()


def launch_server():
    os.chdir(BASE_DIR)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MissionControlHandler) as httpd:
        print(f"\nMission Control Online at http://localhost:{PORT}")
        print(f"Serving: {BASE_DIR}")
        print("Press Ctrl+C to terminate.\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer terminated.")


if __name__ == "__main__":
    launch_server()
