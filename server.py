import http.server
import socketserver
import os

PORT = 8000
NOT_FOUND_PAGE = "404.html"  # Path to your 404 page

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Append .html to extension-less URLs
        if not '.' in self.path and not self.path.endswith('/'):
            self.path += '.html'
        
        # Try to serve the requested file
        try:
            # Check if the file exists
            file_path = self.translate_path(self.path)
            if os.path.exists(file_path) and not os.path.isdir(file_path):
                return http.server.SimpleHTTPRequestHandler.do_GET(self)
            else:
                # If file doesn't exist, serve 404.html
                self.serve_404()
        except Exception as e:
            # Handle any other errors by serving 404
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