# Use nginx alpine for a lightweight image
FROM nginx:alpine

# Copy the website files to nginx's html directory
COPY index.html /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY parser.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY README.md /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# nginx will start automatically with the default CMD
