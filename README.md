# Bitespeed Identity Reconciliation API

This is a backend service for Bitespeed's identity reconciliation problem. The goal is to help FluxKart identify returning customers even when they use different combinations of phone numbers and emails for different orders.

## 🚀 Hosted API

**Base URL:**  
`https://api-bitespeed-vp24.onrender.com`

### 🔍 Identify Endpoint

**Endpoint:**  
`POST /identify`

**Description:**  
This endpoint receives a combination of `email` and/or `phoneNumber` and identifies the primary contact. It returns a consolidated view of the user identity based on previous records stored in the database.

---

## 🔧 Request Format

```json
{
  "email": "example@gmail.com",
  "phoneNumber": "9999999999"
}
```

- Both fields are optional, but at least one must be provided.
- The system checks for existing records by either phone number or email and links them under one identity.

---

## ✅ Response Format

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["example@gmail.com", "other@example.com"],
    "phoneNumbers": ["9999999999"],
    "secondaryContactIds": [2, 3]
  }
}
```

- `primaryContatctId`: ID of the primary contact
- `emails`: All linked emails, starting with the primary
- `phoneNumbers`: All linked phone numbers, starting with the primary
- `secondaryContactIds`: IDs of all secondary contacts linked to the primary

---

## 🧪 Sample `curl` Request

```bash
curl --location --request POST 'https://api-bitespeed-vp24.onrender.com/identify' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "example@gmail.com",
    "phoneNumber": "9999999999"
}'
```

---

## 🗃️ Database Schema

Table: `Contact`

```ts
CREATE TABLE `contact` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phoneNumber` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `linkedId` int DEFAULT NULL,
  `linkPrecedence` enum('primary','secondary') NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phoneNumber`),
  KEY `linkedId` (`linkedId`),
  CONSTRAINT `contact_ibfk_1` FOREIGN KEY (`linkedId`) REFERENCES `contact` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4;
```

- Contacts with the same `phoneNumber` or `email` are linked.
- The oldest contact becomes the `primary`, others become `secondary`.

---

## ⚙️ Tech Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **MySQL**
- **Render.com** for deployment
- **freesqldatabase.com** for MySQL DB service

---

## 📁 Repository Setup

```bash
# Clone the repo
git clone https://github.com/ashutosh-s15/bitespeed-identity-reconciliation.git

# Install dependencies
npm install

# Set up your .env file with DB config
cp .env.example .env

# Start the server
npm run start:dev
```
