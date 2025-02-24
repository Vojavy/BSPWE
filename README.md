# BSPWE - Backend Service for Personal Web Environment

## Overview
BSPWE is a backend service that provides API endpoints for managing web hosting and domain services. The service is built using Symfony framework and provides secure authentication, domain management, and user profile features.

## API Documentation

### Authentication Endpoints

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "token": "string",
    "user": {
      "id": "number",
      "username": "string",
      "email": "string"
    }
  }
  ```

#### Register
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "userId": "number",
    "message": "string"
  }
  ```

### User Endpoints
Base URL: `/api/user`

#### Get User Profile
- **URL**: `/api/user/profile`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "domains": [
        {
          "id": "number",
          "name": "string",
          "createdAt": "string"
        }
      ]
    }
  }
  ```

### Domain Endpoints
Base URL: `/api/domains`

#### Get Domain Details
- **URL**: `/api/domains/{id}/details`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": "boolean",
    "connection_details": {
      "domain": "string",
      "db": {
        "host": "string",
        "name": "string",
        "user": "string",
        "password": "string"
      },
      "ftp": {
        "host": "string",
        "user": "string",
        "password": "string"
      }
    }
  }
  ```

#### Get Domain Files
- **URL**: `/api/domains/{id}/files`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `path` (optional, default: "/")
- **Response**:
  ```json
  {
    "status": "success",
    "items": [
      {
        "name": "string",
        "type": "string",
        "size": "number",
        "modified": "string"
      }
    ]
  }
  ```

#### Buy Domain
- **URL**: `/api/domains/buy`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "domain_name": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": "boolean",
    "message": "string",
    "connection_details": "object"
  }
  ```

#### Reset FTP Password
- **URL**: `/api/domains/{id}/ftp/reset-password`
- **Method**: `POST`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": "boolean",
    "message": "string",
    "new_password": "string"
  }
  ```

#### Delete Domain
- **URL**: `/api/domains/{id}`
- **Method**: `DELETE`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": "boolean",
    "message": "string"
  }
  ```
- **Error Responses**:
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Domain not found"
    }
    ```
  - `403 Forbidden`:
    ```json
    {
      "success": false,
      "message": "Access denied"
    }
    ```

### Public Endpoints
Base URL: `/api`

#### Get About Information
- **URL**: `/api/about`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "company": {
      "name": "string",
      "mission": "string",
      "history": "string",
      "values": ["string"],
      "contact": {
        "email": "string",
        "phone": "string",
        "address": "string"
      }
    }
  }
  ```

#### Get Price List
- **URL**: `/api/pricelist`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "services": [
      {
        "service": "string",
        "price": "string",
        "features": ["string"]
      }
    ]
  }
  ```
