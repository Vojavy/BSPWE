# BSPWE - Backend Service for Personal Web Environment

## Overview
BSPWE is a backend service that provides API endpoints for managing web hosting and domain services. The service is built using Symfony framework and provides secure authentication, domain management, and user profile features.

## API Documentation

### Authentication Endpoints
Base URL: `/api/auth`

#### Login
- **POST** `/api/auth/login`
- **Description**: Authenticate user and receive JWT token
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: JWT token and user information

#### Register
- **POST** `/api/auth/register`
- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User ID and success message

### User Endpoints
Base URL: `/api/user`

#### Get User Profile
- **GET** `/api/user/profile`
- **Description**: Get authenticated user's profile information
- **Authentication**: Required
- **Response**: User profile data including domains

### Domain Endpoints
Base URL: `/api/domains`

#### Get Domain Details
- **GET** `/api/domains/{id}/details`
- **Description**: Get detailed information about a specific domain
- **Authentication**: Required
- **Response**: Domain connection details

#### Get Domain Files
- **GET** `/api/domains/{id}/files`
- **Description**: List files for a specific domain
- **Authentication**: Required
- **Query Parameters**: `path` (optional)
- **Response**: List of files and directories

#### Buy Domain
- **POST** `/api/domains/buy`
- **Description**: Purchase a new domain
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "domain_name": "string"
  }
  ```
- **Response**: Domain connection details

#### Reset FTP Password
- **POST** `/api/domains/{id}/ftp/reset-password`
- **Description**: Reset FTP password for a domain
- **Authentication**: Required
- **Response**: New FTP password

### Public Endpoints
Base URL: `/api`

#### About
- **GET** `/api/about`
- **Description**: Get company information
- **Authentication**: Not required
- **Response**: Company details

#### Price List
- **GET** `/api/pricelist`
- **Description**: Get hosting service prices
- **Authentication**: Not required
- **Response**: List of available hosting packages

## Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/Vojavy/BSPWE.git
```

2. Install dependencies:
```bash
composer install
```

3. Configure your environment variables:
- Copy `.env` to `.env.local`
- Update database and JWT configuration

4. Run database migrations:
```bash
php bin/console doctrine:migrations:migrate
```

5. Start the Symfony server:
```bash
symfony server:start
```

## Requirements
- PHP 8.1 or higher
- Composer
- PostgreSQL
- Symfony CLI (for development)

## Security
- All sensitive endpoints are protected with JWT authentication
- Passwords are securely hashed
- Rate limiting is implemented on authentication endpoints
- CORS policies are properly configured
