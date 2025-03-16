# BSPWE Hosting Center

This project is a hosting control panel that provides a full-stack solution with a Next.js frontend, a Symfony backend, Apache web server, Bind9 DNS, and Pure-FTPd FTP server. The system runs within Docker containers and uses PostgreSQL as its database.

## Project Structure

```
BSPWE/
├── apache
│   └── hosting.conf          # Apache virtual host configuration
├── backend                   # Symfony backend application
│   ├── bin                   # Symfony console
│   ├── config                # Symfony configuration files
│   ├── public                # Public entry point (index.php)
│   ├── src                   # Application source code (Controllers, Entities, etc.)
│   ├── .env                  # Environment variables
│   ├── composer.json         # Composer dependencies
│   └── ...                   # Other Symfony files and directories
├── bind                      # DNS configuration files for Bind9
│   ├── db.mojefirma          # DNS zone file for mojefirma.cz
│   └── named.conf.local      # Bind9 local configuration
├── data                      # FTP data directories
│   ├── ftp                   # FTP directory for admin accounts
│   └── users                 # User FTP directories
├── database                  # Database initialization scripts
│   └── init.sql              # SQL file to initialize the PostgreSQL database
├── front                     # Next.js frontend application
│   ├── public                # Public assets (images, etc.)
│   ├── src                   # Frontend source code (pages, components, etc.)
│   ├── package.json          # NPM dependencies
│   └── ...                   # Other Next.js configuration files
├── supervisor                # Supervisor configuration
│   └── hosting.conf          # Processes management configuration
├── docker-compose.yml        # Docker Compose configuration
├── hosting-center.Dockerfile # Dockerfile for building the hosting center container
├── entrypoint.sh             # Container entrypoint script (sets up FTP, DB migrations, etc.)
└── run_migrations.sh         # Script to run database migrations
```

## Technologies Used

- **Apache** – Web server for serving websites and proxying to the frontend and backend.
- **Bind9** – DNS server for domain name resolution.
- **Pure-FTPd** – FTP server for file uploads.
- **PHP 8.1 / Symfony** – Backend application framework.
- **Next.js / Bun** – Frontend application framework using Bun for package management and runtime.
- **PostgreSQL** – Database server.
- **Docker & Docker Compose** – Containerization and orchestration.

## Prerequisites

- Docker and Docker Compose installed on your machine.
- Basic knowledge of Docker, PHP/Symfony, and Next.js.

## Setup and Deployment

1. **Clone the Repository**

   ```bash
   git clone https://your.repository.url/BSPWE.git
   cd BSPWE
   ```

2. **Configure Environment Variables**

   Adjust environment variables as needed in the `.env` files located in the `backend` directory. Also, ensure your Docker Compose environment variables (e.g. for PostgreSQL and FTP credentials) are set in `docker-compose.yml`.

3. **Build and Start Containers**

   Build and run the Docker containers using Docker Compose:

   ```bash
   docker-compose up --build
   ```

4. **Database Initialization**

   The PostgreSQL container will automatically run the `init.sql` script from the `database` directory to initialize the database.

5. **Accessing the Services**

   - **Frontend:** http://localhost (or your custom domain if configured)
   - **Backend API:** http://localhost/api
   - **FTP:** Connect via an FTP client to ftp.[your_domain] on port 21
   - **DNS:** Bind9 is configured to handle DNS requests for your domain (e.g. `*.mojefirma.cz`)

## Local Domain Resolution

Since the `/etc/hosts` file does not support wildcard DNS entries, for local development you have two options:

- **Option 1:** Add explicit entries in your hosts file for the domains you need (e.g., `hosting.mojefirma.cz`, `www.mojefirma.cz`).
- **Option 2:** Set up a local DNS server (like `dnsmasq`) with a wildcard entry, for example:
  
  ```
  address=/.mojefirma.cz/127.0.0.1
  ```
  
  Then configure your system to use the local DNS server.

## Supervisor Configuration

Supervisor is used to manage the Apache, Bind9, Pure-FTPd, Next.js, and PHP backend processes. Its configuration is located in `supervisor/hosting.conf` and directs logs to standard output for Docker logging.

## FTP Configuration

The Pure-FTPd configuration files are located in the `ftp-config` directory. These files (e.g., `NoAnonymous` and `PassivePortRange`) are mounted into the container to allow external configuration of the FTP server.

- **PassivePortRange:** Defines the range of ports for passive FTP connections.
- **NoAnonymous:** Controls whether anonymous FTP access is allowed.

Make sure that the `PassivePortRange` in your config matches the port range exposed in Docker Compose (e.g., `"30000-30009:30000-30009"`).

## Additional Notes

- **Migrations:** The backend uses Doctrine for migrations. You can run migrations using the `run_migrations.sh` script.
- **Logging:** All logs from the services are forwarded to the container’s stdout/stderr via Supervisor, so you can inspect logs with `docker-compose logs`.

## Troubleshooting

- **Apache Already Running:** Ensure that no other process starts Apache outside of Supervisor.
- **FTP Passive Connection Issues:** Verify that the PassivePortRange is correctly set in your FTP config and that the ports are open in Docker.
- **Domain Resolution:** Use a local DNS server (e.g., dnsmasq) for wildcard domain resolution if needed.
- **Security:** it`s plain http based project which is not secure.
