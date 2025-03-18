import http.server
import socketserver
import os
from urllib.parse import urlparse, parse_qs

PORT = 8000
NOT_FOUND_PAGE = "404.html"  # Path to your 404 page

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL to separate the path and query parameters
        parsed_url = urlparse(self.path)
        path = parsed_url.path  # Get the path without query params
        
        # Append .html to extension-less URLs (ignoring query params)
        if not '.' in path and not path.endswith('/'):
            path += '.html'
        
        # Update self.path to the cleaned path (without query params for file lookup)
        self.path = path
        
        # Try to serve the requested file
        try:
            # Check if the file exists
            file_path = self.translate_path(self.path)
            if os.path.exists(file_path) and not os.path.isdir(file_path):
                # Optionally, you can access query params here for dynamic content
                query_params = parse_qs(parsed_url.query)
                print(f"Query params: {query_params}")  # e.g., {'r': ['Jinhsi']}
                
                return http.server.SimpleHTTPRequestHandler.do_GET(self)
            else:
                # If file doesn't exist, serve 404.html
                self.serve_404()
        except Exception as e:
            # Handle any other errors by serving 404
            print(f"Error: {e}")
            self.serve_404()

    def serve_404(self):
        # Serve the custom 404 page
        self.send_response(404)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        
        try:
            with open(NOT_FOUND_PAGE, 'rb') as f:
                self.wfile.write(f.read())
        except FileNotFoundError:
            # Fallback if 404.html itself is missing
            self.wfile.write(b"<h1>404 Not Found</h1><p>Custom 404 page not found.</p>")

Handler = CustomHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()