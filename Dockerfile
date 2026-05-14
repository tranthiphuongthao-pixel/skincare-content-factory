# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Python backend — serves API + built frontend
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-builder /app/dist ./static

RUN mkdir -p /app/uploads/products

ENV PORT=8000
EXPOSE $PORT
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
