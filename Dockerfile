FROM php:8.2-apache

# Install ekstensi mysqli
RUN docker-php-ext-install mysqli

# (opsional) aktifkan rewrite .htaccess
RUN a2enmod rewrite
