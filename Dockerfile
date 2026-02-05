# Use nginx alpine for a lightweight image
FROM nginx:alpine

# Copy the website files to nginx's html directory
COPY index.html /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/
COPY css/ /usr/share/nginx/html/css/
COPY stemgraphlogo.svg /usr/share/nginx/html/
COPY README.md /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# nginx will start automatically with the default CMD
