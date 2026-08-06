.PHONY: install run-rag run-backend run-frontend run-all stop test check clean help

help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies for all services"
	@echo "  make run-rag       - Start the FastAPI RAG service"
	@echo "  make run-backend   - Start the Node.js backend"
	@echo "  make run-frontend  - Start the frontend service"
	@echo "  make run-all       - Start all services in the background"
	@echo "  make stop          - Stop all background services"
	@echo "  make test          - Check health endpoint of the RAG service"
	@echo "  make check         - Run syntax and import verification"
	@echo "  make clean         - Remove cache files and node_modules"

install:
	@echo "Installing RAG service dependencies..."
	pip3 install -r rag_service/requirements.txt
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

run-rag:
	@echo "Starting RAG service..."
	cd rag_service && DOCUMENTS_DIR=../backend/documents python3 main.py

run-backend:
	@echo "Starting backend service..."
	cd backend && npm start

run-frontend:
	@echo "Starting frontend service..."
	cd frontend && node app.js

run-all:
	@echo "Starting all services in the background..."
	cd rag_service && DOCUMENTS_DIR=../backend/documents python3 main.py & echo $$! > ../rag.pid
	cd backend && npm start & echo $$! > ../backend.pid
	cd frontend && node app.js & echo $$! > ../frontend.pid
	@echo "All services started. Use 'make stop' to kill them."

stop:
	@echo "Stopping all services..."
	@-kill `cat rag.pid` 2>/dev/null || true
	@-kill `cat backend.pid` 2>/dev/null || true
	@-kill `cat frontend.pid` 2>/dev/null || true
	@rm -f rag.pid backend.pid frontend.pid
	@echo "All services stopped."

test:
	@echo "Testing RAG service health endpoint..."
	curl -s http://localhost:8000/health | grep -q "healthy" && echo "RAG Service is healthy!" || echo "RAG Service is down or unresponsive."

check:
	@echo "Checking Python syntax in rag_service/main.py..."
	python3 -c 'import ast; ast.parse(open("rag_service/main.py").read())' && echo "Syntax is OK."
	@echo "Checking key Python imports..."
	python3 -c 'import llama_index; import fastapi; import rank_bm25;' && echo "Imports are OK."

clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf backend/node_modules frontend/node_modules
	rm -f rag.pid backend.pid frontend.pid
	@echo "Clean complete."
