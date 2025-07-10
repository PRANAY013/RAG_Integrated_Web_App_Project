import os 
# - - - - - 

# local fallback setup 

# pip3 install ollama
# brew ollama
# import ollama 
# use gemma2B with ollama - local as a fallback mechanism 



# - - - - - 

# API key management 

from userData import UserData
user_data = UserData()
GROQ_KEY = user_data.get("GROQ_API_KEY")
# OPENAI_KEY = user_data.get("OPENAI_API_KEY")



# - - - - - 

# MODEL SELECTION : NAME RPM RPD TPM TPD
# refer for models and rate limits : https://console.groq.com/docs/rate-limits

model_config = {
    "fast_highlimiter": {
        "model": "llama-3.1-8b-instant",
        "rpm": 30, "rpd": 14400,
        "tpm": 6000, "tpd": 500000,
        "use_case": "rapid_development_interactive_demos"
    },
    
    "quality_highlimiter": {
        "model": "llama3-70b-8192",  # Keep this - excellent balance
        "rpm": 30, "rpd": 14400,
        "tpm": 6000, "tpd": 500000,
        "use_case": "high_quality_outputs_generous_limits"
    },
    
    "cutting_edge_option": {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "rpm": 30, "rpd": 1000,
        "tpm": 30000, "tpd": 500000,
        "use_case": "volume_inputs_advance_model_low_limits"
    }
}

llama31_8 = "llama-3.1-8b-instant"  # 14,400 RPD - Primary
llama3_70 = "llama3-70b-8192"       # 14,400 RPD
llama4_17 = "meta-llama/llama-4-scout-17b-16e-instruct"  # 1,000 RPD



# - - - - - 

# GROQ API CLIENT SETUP 
# --- redundant now sincce using the llamaindex_llm model for groq --- 

import requests 
from datetime import datetime

class GroqClient :

    def __init__ (self, api_key) :
        self.api_key = api_key 
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization" : f"Bearer {api_key}" ,
            "Content-Type" : "application/json" 
        }

    def chat (self, prompt, model=llama31_8, max_tokens=1000) :

        # generic structure 
        payload = {
            "model" : model,
            "messages" : [{"role":"user", "content":prompt}],
            "max_tokens": max_tokens,
            "temperature" : 0.125       
        }

        # send message for inference
        response = requests.post(self.base_url, headers=self.headers, json=payload)

        # returning response and reflecting error
        if response.status_code == 200 :
            return response.json()["choices"][0]["message"]["content"]
        else :
            raise Exception(f"Groq API error : {response.status_code} - {response.text}")
        
# initialization
# groq_client = GroqClient(GROQ_KEY)
    


# - - - - -

# Quick Test for Groq

# def test_groq_setup():
#     print("\n====================\nTesting Groq LLM Setup...")
#     print(f"GROQ Key loaded: {'Yes' if GROQ_KEY else 'No'}")
    
#     try:

#         response = groq_client.chat("tell me about llama31_8")
#         print("\n\nllama31_8 model working\n response : ",response)

#         response = groq_client.chat("tell me about llama3_70", model=llama3_70)
#         print("\n\nllama3_70 model working\n response : ",response)

#         response = groq_client.chat("tell me about llama4_17", model=llama4_17)
#         print("\n\nllama4_17 model working\n response : ",response)

#         print("\n\n🎯 All systems ready for LlamaIndex integration!\n====================\n")
        
#     except Exception as e:
#         print(f"❌ Error: {e}")



# - - - - -
from pathlib import Path
import re 
import os 
import time 
import json

# LLAMAINDEX INTEGRATION - signature 5LINE

# set/select/choose model global 
MODEL_GLOBAL = llama4_17

from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.groq import Groq

# local embeddings - no OpenAI dependency - hidden process
Settings.embed_model = HuggingFaceEmbedding (model_name="BAAI/bge-small-en-v1.5")
# model selection - can be done locally in function but openAI is being referenced
Settings.llm = Groq(model=MODEL_GLOBAL, api_key=GROQ_KEY)


# Configuration for document directory
DOCUMENTS_DIR = os.getenv('DOCUMENTS_DIR','./backend/documents')

# Make path absolute and ensure it exists
documents_path = Path(DOCUMENTS_DIR).resolve()
documents_path.mkdir(exist_ok=True)

# # for input dir and multiple files - GLOBAL SET
# documents  = SimpleDirectoryReader(input_dir = documents_path).load_data()

# # llm context def - the user message query - GLOBAL SET
# index = VectorStoreIndex.from_documents(documents)
# query_engine = index.as_query_engine()

documents = None
index = None
query_engine = None

# Initialize documents only if directory has files
try:
    documents = SimpleDirectoryReader(input_dir=str(documents_path)).load_data()
    if documents:
        index = VectorStoreIndex.from_documents(documents)
        query_engine = index.as_query_engine()
        print(f"✅ Loaded {len(documents)} documents successfully")
    else:
        print("⚠️ No documents found in directory")
except Exception as e:
    print(f"⚠️ Error loading documents: {e}")

# - - -

# def analyze_doc (file_path, question="summarize this document") :

#     # model definition - groq api used here 
#     # llm = Groq(model=MODEL_GLOBAL, api_key=GROQ_KEY) # globallyset

#     # for indivisual files - test purpose 
#     documents = SimpleDirectoryReader(input_files = [file_path]).load_data()

#     # llm context def - the user message query
#     # index = VectorStoreIndex.from_documents(documents)

#     # RAG function - query the document
#     query_engine = index.as_query_engine()
#     response = query_engine.query(question)

#     return str(response)

# def test_analyze_doc () :

#     result = analyze_doc(
#         "testdoc.pdf",
#         "What is machine learning and summarize this document",
#     )

#     print ("\n= = = = = = = = = = = = = = = = = = = =\nDocument Analysis Result: ")
#     print (result)



# - - - - -

# FAST_API STUFF - setup and settings

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Optional, List, Dict, Any

app = FastAPI(title="RAG Service API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001" , 
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SourceInfo(BaseModel):
    file_name: str
    original_filename: Optional[str] = None
    page_label: Optional[str] = "N/A"
    file_size: Optional[int] = 0
    document_title: Optional[str] = None
    content_preview: Optional[str] = None
    relevance_score: Optional[float] = 0.0

# Request/Response models
class QueryRequest(BaseModel):
    query: str
    user_id: str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    response: str
    sources: List[SourceInfo] = []  
    model_used: str
    processing_time: float



# - - - 

# Document Handling Fast APi

# Configuration for document directory
DOCUMENTS_DIR = os.getenv('DOCUMENTS_DIR','./backend/documents')

# Make path absolute and ensure it exists
documents_path = Path(DOCUMENTS_DIR).resolve()
documents_path.mkdir(exist_ok=True)

print(f"📁 Using documents directory: {documents_path}")

# Update document loading
documents = SimpleDirectoryReader(input_dir=str(documents_path)).load_data()

# Update reindex endpoint
@app.post("/reindex")
async def reindex_documents(request: dict = None):
    """Reindex all documents in the configured directory"""
    try:
        start_time = time.time()
        if not documents_path.exists():
            documents_path.mkdir(exist_ok=True)
        
        # Use configured documents path
        pdf_files = list(documents_path.glob("*.pdf"))
        
        if not pdf_files:
            return {
                "success": False,
                "message": "No PDF documents found to index",
                "documents_path": str(documents_path)
            }
        
        print(f"🔄 Reindexing {len(pdf_files)} documents from {documents_path}...")
        
        # Reload documents from configured path
        global documents, index, query_engine
        documents = SimpleDirectoryReader(input_dir=str(documents_path)).load_data()
        
        # Recreate index
        index = VectorStoreIndex.from_documents(documents)
        query_engine = index.as_query_engine()
        
        processing_time = time.time() - start_time
        
        print(f"✅ Reindexing completed in {processing_time:.2f}s")
        
        return {
            "success": True,
            "message": f"Successfully reindexed {len(pdf_files)} documents",
            "documents_count": len(pdf_files),
            "processing_time": processing_time,
            "indexed_files": [f.name for f in pdf_files],
            "documents_path": str(documents_path)
        }
        
    except Exception as e:
        print(f"❌ Reindexing error: {str(e)}")
        return {
            "success": False,
            "message": f"Reindexing failed: {str(e)}"
        }


# FIXED: Document status endpoint
@app.get("/documents/status")
async def get_documents_status():
    """Get status of indexed documents"""
    try:
        # Use the global documents_path variable
        pdf_files = list(documents_path.glob("*.pdf"))
        
        document_info = []
        for file_path in pdf_files:
            file_stat = file_path.stat()
            document_info.append({
                "filename": file_path.name,
                "size": file_stat.st_size,
                "modified": datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                "status": "indexed",
                "path": str(file_path)
            })
        
        return {
            "success": True,
            "documents": document_info,
            "total_count": len(document_info),
            "documents_directory": str(documents_path)
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to get document status: {str(e)}"
        }




# - - - 

# Fast API - respone generation 

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    try:
        start_time = time.time()
        
        # Check if query engine is initialized
        global documents, index, query_engine
        
        if query_engine is None:
            try:
                print("🔄 Initializing RAG system...")
                documents = SimpleDirectoryReader(input_dir=str(documents_path)).load_data()
                if not documents:
                    raise HTTPException(
                        status_code=503, 
                        detail="No documents available. Please upload documents first."
                    )
                index = VectorStoreIndex.from_documents(documents)
                query_engine = index.as_query_engine()
                print(f"✅ RAG system initialized with {len(documents)} documents")
            except Exception as init_error:
                print(f"❌ RAG initialization error: {str(init_error)}")
                raise HTTPException(
                    status_code=503,
                    detail=f"Failed to initialize RAG system: {str(init_error)}"
                )

        print(f"🔍 Processing query: {request.query[:50]}...")
        
        # Process query through RAG
        response = query_engine.query(request.query)
        processing_time = time.time() - start_time

        # Enhanced source processing with proper SourceInfo objects
        enhanced_sources = []
        try:
            for node in response.source_nodes:
                try:
                    # Extract metadata safely
                    metadata = getattr(node.node, 'metadata', {}) if hasattr(node.node, 'metadata') else {}
                    
                    # Get file information
                    file_path = metadata.get('file_path', '')
                    file_name = metadata.get('file_name', '')
                    
                    if not file_name and file_path:
                        file_name = os.path.basename(file_path)
                    
                    # Clean filename (remove timestamp prefix)
                    if file_name:
                        clean_name = re.sub(r'^\d+-[a-z0-9]+-', '', file_name)
                        if not clean_name:
                            clean_name = file_name
                    else:
                        clean_name = "Unknown Document"

                    # Get content preview safely
                    content_text = getattr(node.node, 'text', '') if hasattr(node.node, 'text') else ''
                    content_preview = content_text[:100] + "..." if len(content_text) > 100 else content_text

                    # Create SourceInfo object
                    source_info = SourceInfo(
                        file_name=clean_name,
                        original_filename=file_name,
                        page_label=metadata.get('page_label', 'N/A'),
                        file_size=metadata.get('file_size', 0),
                        document_title=metadata.get('document_title', clean_name),
                        content_preview=content_preview,
                        relevance_score=getattr(node, 'score', 0.0) if hasattr(node, 'score') else 0.0
                    )
                    
                    enhanced_sources.append(source_info)
                    
                except Exception as e:
                    print(f"Error processing individual source: {e}")
                    enhanced_sources.append(SourceInfo(
                        file_name="Document Reference",
                        page_label="N/A",
                        file_size=0,
                        content_preview="Content not available",
                        relevance_score=0.0
                    ))
        except Exception as e:
            print(f"Error processing sources: {e}")
            enhanced_sources = [SourceInfo(
                file_name="Document Reference", 
                content_preview="Source processing error"
            )]

        print(f"✅ Query processed successfully in {processing_time:.2f}s")
        
        return QueryResponse(
            response=str(response),
            sources=enhanced_sources,
            model_used=MODEL_GLOBAL,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Query processing error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "model": MODEL_GLOBAL,
        "documents_loaded": len(documents) if documents else 0,
        "documents_directory": str(documents_path)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


# - - - - -


