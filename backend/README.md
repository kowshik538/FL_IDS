# AgisFL Enterprise Backend

World-class Federated Learning Intrusion Detection System backend with enterprise-grade security and scalability.

## 🚀 Quick Start

### Local Development

**Option A: Use the run script (recommended)**  
From the project root or from `backend/`, run:
```batch
backend\run_backend.bat
```
This uses the project's `venv` automatically.

**Option B: Manual run with venv**
```bash
# From project root: create venv and install deps (once)
python -m venv venv
venv\Scripts\activate
pip install -r backend\requirements.txt

# From project root, run backend (with venv activated)
cd backend
python main.py
```

If you see `ModuleNotFoundError: No module named 'uvicorn'`, the venv is not active—use Option A or run `..\venv\Scripts\activate` from the backend folder before `python main.py`.

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t agisfl-enterprise .
docker run -p 8001:8001 agisfl-enterprise
```

### Production Deployment
```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh
```

## 🏗️ Architecture

### Core Components
- **FastAPI**: High-performance async web framework
- **Flower**: Production-ready federated learning
- **PyTorch**: Deep learning models
- **SQLAlchemy**: Database ORM with async support
- **Prometheus**: Metrics and monitoring
- **Structured Logging**: JSON-based logging

### Federated Learning
- **Strategies**: FedAvg, FedProx, SCAFFOLD
- **Models**: Neural networks for IDS
- **Privacy**: Differential privacy support
- **Scalability**: 100+ concurrent clients

### Security Features
- **JWT Authentication**: Secure API access
- **RBAC**: Role-based access control
- **Input Validation**: Pydantic models
- **Rate Limiting**: DDoS protection
- **CORS**: Configurable origins

## 📊 API Endpoints

### Core
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /docs` - API documentation

### Dashboard
- `GET /api/dashboard` - Comprehensive dashboard data

### Federated Learning
- `GET /api/fl/status` - FL system status
- `POST /api/fl/start` - Start FL training
- `GET /api/fl/strategies` - Available strategies

### Security
- `GET /api/security/threats` - Detected threats
- `GET /api/security/metrics` - Security metrics

### Network
- `GET /api/network/stats` - Network statistics
- `GET /api/network/packets` - Packet analysis

## 🔧 Configuration

All configuration is handled through environment variables or the `.env` file.

Key settings:
- `JWT_SECRET`: Secure JWT signing key
- `DATABASE_URL`: Database connection string
- `FL_STRATEGY`: Default FL strategy
- `CORS_ORIGINS`: Allowed frontend origins

## 🚀 Deployment Options

### 1. Standalone Python
```bash
python main.py
```

### 2. Docker Container
```bash
docker-compose up -d
```

### 3. Kubernetes
```bash
kubectl apply -f k8s/
```

### 4. Cloud Platforms
- **AWS**: Use ECS or Lambda
- **GCP**: Use Cloud Run or GKE
- **Azure**: Use Container Instances

## 📈 Monitoring

### Health Checks
- `/health` - Application health
- `/healthz` - Kubernetes liveness
- `/readyz` - Kubernetes readiness

### Metrics
- Prometheus metrics at `/metrics`
- Structured JSON logging
- Performance monitoring
- Security event tracking

## 🔒 Security

### Authentication
- JWT-based authentication
- Bcrypt password hashing
- Role-based access control

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting

### Privacy
- Differential privacy in FL
- Secure aggregation
- Data minimization

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=. --cov-report=html

# Load testing
locust -f tests/load_test.py
```

## 📝 License

MIT License - See LICENSE file for details.