# Ride Hailing Backend

Ride-hailing backend service built with Node.js, Express, TypeScript, PostgreSQL, and Redis. Features real-time driver matching, ride state management, and comprehensive event sourcing.

## 🚀 Quick Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **npm** or **yarn**

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/EssaadaniYounes/ride-hailing-api
   cd ride-hailing-api
   ```

2. **Install dependencies**
   ```bash
   npm install --force --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration (the defaults should work for local development).

4. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```
   
   This starts:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - Elasticsearch (port 9200) - optional
   - Kibana (port 5601) - optional

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Seed the database** (optional, for testing)
   ```bash
   npm run seed
   ```
   
   This creates:
   - 1 test user (`client@test.com`)
   - 3 test drivers at different Paris locations
   - Password for all: `password123`

7. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Server runs on `http://localhost:4000`

8. **Verify the setup**
   ```bash
   curl http://localhost:4000/health
   ```

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run migrate` | Run Prisma migrations |
| `npm run studio` | Open Prisma Studio (database GUI) |
| `npm run seed` | Seed database with test data |

## 🏗️ Project Structure

```
ride-hailing-backend/
├── src/
│   ├── config/          # Environment and configuration
│   ├── domain/          # Business logic (auth, ride)
│   ├── errors/          # Error handling
│   ├── factories/       # Service factories (Prisma, Redis, Server)
│   ├── lib/             # Shared libraries (logger, Prisma client)
│   ├── middleware/      # Express middleware (auth, validation)
│   └── utils/           # Helper utilities
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── scripts/
│   └── seed-e2e.ts      # E2E test seeding script
└── docker-compose.yaml  # Infrastructure services
```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Rides (Protected)
- `POST /api/v1/rides/create` - Request a new ride
- `PATCH /api/v1/rides/:id/accept` - Accept ride request
- `PATCH /api/v1/rides/:id/cancel` - Cancel ride request
- `GET /api/v1/rides/:id/status` - Get ride status/History
- `GET /api/v1/rides/history` - Get History of rides

## 🧪 Testing the Flow

1. **Register a user**
   ```bash
   curl -X POST http://localhost:4000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "client@example.com",
       "password": "password123",
       "role": "USER"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:4000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "client@example.com",
       "password": "password123"
     }'
   ```

3. **Request a ride** (use the token from login)
   ```bash
   curl -X POST http://localhost:4000/api/v1/rides/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-token>" \
     -d '{
       "pickupLat": 48.8566,
       "pickupLng": 2.3522,
       "dropoffLat": 48.8606,
       "dropoffLng": 2.3376,
       "locationEnabled": true
     }'
   ```

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis (driver matching, TTL offers)
- **Logging**: Winston with Elasticsearch integration (optional)
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **Rate Limiting**: express-rate-limit

## 🔍 Key Features

- **Real-time Driver Matching**: Finds nearest available driver using geospatial calculations
- **TTL-based Offers**: 15-second driver acceptance window with Redis
- **Event Sourcing**: Complete ride history tracking with `RideEvent` model
- **State Machine**: Robust ride state transitions (MATCHING → DRIVER_ASSIGNED → ARRIVED → ONGOING → COMPLETED)
- **Role-based Access**: Separate USER and DRIVER roles with authorization
- **Comprehensive Logging**: Winston logger with optional Elasticsearch integration
- **Health Checks**: Built-in health endpoint for monitoring

## 🐳 Docker Services

The `docker-compose.yaml` includes:

- **PostgreSQL**: Main database
- **Redis**: Caching and driver offer TTL management
- **Elasticsearch**: Optional centralized logging
- **Kibana**: Optional log visualization

To stop services:
```bash
docker-compose down
```

To view logs:
```bash
docker-compose logs -f
```

## 📝 Environment Variables

Key environment variables (see `.env.example`):

## 🚨 Troubleshooting

### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis connection issues
```bash
# Check Redis connectivity
docker-compose logs redis

# Flush Redis cache
docker-compose exec redis redis-cli -a your_strong_password FLUSHALL
```

### Migration issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

## 📄 License
essaadani.yo@gmail.com
