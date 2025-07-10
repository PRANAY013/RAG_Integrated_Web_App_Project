# RAG Integrated Web Application - Project Overview

A comprehensive full-stack web application that combines document upload, processing, and intelligent querying through a Retrieval-Augmented Generation (RAG) system. This project demonstrates advanced integration of modern web technologies with AI-powered document analysis.

## **Project Architecture**

### **Frontend Layer**
- **Technology**: Vanilla JavaScript with Microsoft Copilot-inspired UI design
- **Features**: 
  - Responsive chat interface with real-time messaging
  - Document upload with drag-and-drop functionality
  - Light/dark theme switching
  - User authentication integration
  - Enhanced source citation display

### **Backend API Layer**
- **Technology**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Dual system supporting Google OAuth and local credentials
- **Security**: JWT token validation, bcrypt password hashing, CORS configuration

### **RAG Service Layer**
- **Technology**: Python FastAPI with LlamaIndex integration
- **AI Model**: Groq API using llama-3.1-8b-instant
- **Embeddings**: HuggingFace BAAI/bge-small-en-v1.5 for local processing
- **Document Processing**: PDF ingestion with vector indexing

## **Core Functionality**

### **Document Management**
- **Upload System**: Multi-file upload with validation (PDF, DOC, DOCX, TXT)
- **Storage**: Secure file storage with unique naming and metadata tracking
- **Processing Pipeline**: Automatic document indexing and vector embedding generation
- **Real-time Integration**: Uploaded documents immediately available for querying

### **Intelligent Querying**
- **RAG Processing**: Context-aware document retrieval with AI response generation
- **Enhanced Citations**: Detailed source information including document names, page numbers, content previews, and relevance scores
- **Multi-Document Support**: Simultaneous querying across multiple uploaded documents
- **Session Management**: Conversation tracking with persistent chat history

### **User Experience**
- **Authentication Flow**: Seamless sign-in with Google OAuth or local credentials
- **Chat Interface**: Professional messaging system with typing indicators and smooth animations
- **Document Visualization**: Sidebar display of uploaded documents with management capabilities
- **Response Formatting**: Intelligent formatting of AI responses with proper structure and citations

## **Technical Implementation**

### **Document Processing Pipeline**
1. **Frontend Upload** → User selects documents via drag-and-drop or file browser
2. **Backend Storage** → Files saved to `/backend/documents` with unique identifiers
3. **RAG Indexing** → Python service processes documents and creates vector embeddings
4. **Query Processing** → User queries retrieve relevant context and generate AI responses
5. **Enhanced Display** → Responses include detailed source citations with previews

### **Authentication System**
- **Google OAuth Integration**: Seamless third-party authentication
- **Local Authentication**: Email/password system with secure password hashing
- **Session Persistence**: JWT tokens with automatic refresh and validation
- **User Profile Management**: Dynamic sidebar updates with user information

### **Data Flow Architecture**
- **Frontend** ↔ **Node.js Backend** ↔ **MongoDB Database**
- **Backend** ↔ **Python RAG Service** ↔ **Document Storage**
- **RAG Service** ↔ **Groq API** for AI inference
- **Local Embeddings** for document vectorization

## **Key Features Demonstrated**

### **Advanced Source Citations**
- **Document Identification**: Real document names (e.g., "resumepranay_july2025.pdf", "testdoc.pdf")
- **Content Context**: Preview snippets showing relevant text sections
- **Relevance Scoring**: AI-generated scores indicating source relevance to queries
- **Metadata Display**: File sizes, page numbers, and document structure information

### **Scalable Architecture**
- **Microservices Design**: Separate services for web interface, API, and AI processing
- **Database Optimization**: Indexed schemas for efficient conversation and document queries
- **Error Handling**: Comprehensive error management with graceful fallbacks
- **Performance Monitoring**: Response time tracking and system health monitoring

### **Production-Ready Features**
- **Security Implementation**: Authentication, authorization, and input validation
- **Responsive Design**: Mobile-first approach with cross-device compatibility
- **Real-time Updates**: Automatic document indexing and immediate query availability
- **User Management**: Profile persistence, session handling, and conversation history
