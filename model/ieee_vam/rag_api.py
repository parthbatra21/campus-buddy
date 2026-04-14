import os
import time
from typing import Dict, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.embeddings.base import Embeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
import requests

class GeminiEmbeddings(Embeddings):
    def __init__(self, api_key: str, model: str = "text-embedding-004"):
        self.api_key = api_key
        self.model = model
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={api_key}"

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_query(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        try:
            resp = requests.post(self.url, json={
                "content": {"parts": [{"text": text}]}
            }).json()
            return resp.get("embedding", {}).get("values", [0.0] * 768)
        except Exception as e:
            print(f"Embedding error: {e}")
            return [0.0] * 768

# Load environment variables
PERSIST_DIRECTORY = os.environ.get("PERSIST_DIRECTORY", "db")
TARGET_SOURCE_CHUNKS = int(os.environ.get('TARGET_SOURCE_CHUNKS', 4))
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

# Mock Ollama variables to prevent NameErrors in legacy LangChain chains
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL = os.environ.get("MODEL", "llama2")

app = FastAPI(title="Campus Buddy Local RAG API")

# Global state for the QA chain
qa_chain = None
db_instance = None

def initialize_rag():
    global qa_chain
    global db_instance
    
    print(f"Initializing Lightweight RAG with Gemini Embeddings...")
    
    # 1. Initialize embeddings using Gemini API
    embeddings = GeminiEmbeddings(api_key=GOOGLE_API_KEY)
    
    # --- MODEL DISCOVERY ---
    print("\n--- DISCOVERING AVAILABLE MODELS ---")
    try:
        discovery_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GOOGLE_API_KEY}"
        resp = requests.get(discovery_url).json()
        if "models" in resp:
            for m in resp["models"]:
                m_name = m['name'].replace('models/', '')
                methods = ", ".join(m.get('supportedGenerationMethods', []))
                print(f"AVAILABLE MODEL: {m_name} (Methods: {methods})")
        else:
            # Try v1 if v1beta failed to list
            discovery_url_v1 = f"https://generativelanguage.googleapis.com/v1/models?key={GOOGLE_API_KEY}"
            resp_v1 = requests.get(discovery_url_v1).json()
            if "models" in resp_v1:
                for m in resp_v1["models"]:
                    m_name = m['name'].replace('models/', '')
                    print(f"AVAILABLE MODEL [v1]: {m_name}")
    except Exception as e:
        print(f"Discovery error: {e}")
    print("--- DISCOVERY END ---\n")
    
    # 2. Check for vectorstore
    if not os.path.exists(PERSIST_DIRECTORY):
        print(f"Vector database not found at {PERSIST_DIRECTORY}. Please run ingest.py first or ensure volume is mounted.")
        # In a real production app, we might trigger ingest here, but for now we'll assume it's part of the pipeline.
    
    db = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
    global db_instance
    db_instance = db
    retriever = db.as_retriever(search_kwargs={"k": TARGET_SOURCE_CHUNKS})
    
    # 3. Skip Ollama LLM (Using Gemini in BFF instead)
    # llm = Ollama(model=MODEL, base_url=OLLAMA_BASE_URL)
    
    print("RAG initialization complete (Retrieval Only).")
    return None

    print("RAG Refresh complete.")

@app.on_event("startup")
async def startup_event():
    import threading
    # Run initialization in the background so uvicorn can start immediately
    print("Starting RAG initialization in background thread...")
    threading.Thread(target=initialize_rag, daemon=True).start()

class QueryRequest(BaseModel):
    message: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]

class ContextResponse(BaseModel):
    context: str
    sources: List[str]

def get_qa_chain():
    """Returns a fresh retriever using Gemini state."""
    # 1. Initialize embeddings
    embeddings = GeminiEmbeddings(api_key=GOOGLE_API_KEY)
    
    # 2. Get DB
    db = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
    retriever = db.as_retriever(search_kwargs={"k": TARGET_SOURCE_CHUNKS})
    
    # 3. Get LLM
    llm = Ollama(model=MODEL, base_url=OLLAMA_BASE_URL)
    
    # 4. Define Prompt
    prompt_template = """You are Campus Copilot, a knowledgeable assistant for Manipal University Jaipur (MUJ). 
    Your role is to provide accurate and helpful information based on the provided university documents.
    
    Use the following context to answer the question. If you don't know the answer, say you don't know honestly.
    
    Context: {context}
    
    Question: {question}
    
    Detailed Answer:"""
    
    PROMPT = PromptTemplate(
        template=prompt_template, input_variables=["context", "question"]
    )
    
    # 5. Build chain
    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": PROMPT}
    )

class IngestRequest(BaseModel):
    text: str
    source: str = "User Upload"
    title: str = "New Document"

@app.get("/health")
async def health():
    if db_instance is None:
        return {"status": "initializing", "message": "Vector database is starting up"}
    return {"status": "ready"}

@app.post("/retrieve", response_model=ContextResponse)
async def retrieve(request: QueryRequest):
    if db_instance is None:
        raise HTTPException(status_code=503, detail="RAG engine is still initializing.")
    
    try:
        retriever = db_instance.as_retriever(search_kwargs={"k": TARGET_SOURCE_CHUNKS})
        docs = retriever.get_relevant_documents(request.message)
        
        context = "\n\n".join([d.page_content for d in docs])
        sources = [d.metadata.get("source", "Unknown") for d in docs]
        
        return ContextResponse(context=context, sources=list(set(sources)))
    except Exception as e:
        print(f"Error during retrieval: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=QueryResponse)
async def ask(request: QueryRequest):
    if db_instance is None:
        raise HTTPException(status_code=503, detail="RAG engine is still initializing. Please wait.")
    
    try:
        # 1. Retrieve Context
        retriever = db_instance.as_retriever(search_kwargs={"k": TARGET_SOURCE_CHUNKS})
        docs = retriever.get_relevant_documents(request.message)
        context = "\n\n".join([d.page_content for d in docs])
        sources = list(set([d.metadata.get("source", "Unknown") for d in docs]))
        
        # 2. Call Gemini API Directly
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_API_KEY}"
        
        prompt = f"""You are Campus Copilot, a helpful assistant for MUJ. 
        Answer the user's question based strictly on the context below. 
        If the answer is not in the context, say so.
        
        Context:
        {context}
        
        Question: {request.message}"""
        
        resp = requests.post(url, json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3}
        }).json()
        
        answer = "I couldn't process this request with the AI."
        if "candidates" in resp and len(resp["candidates"]) > 0:
            parts = resp["candidates"][0].get("content", {}).get("parts", [])
            if parts:
                answer = parts[0].get("text", answer)
                
        return QueryResponse(answer=answer, sources=sources)
        
    except Exception as e:
        print(f"Error during QA: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest_text(request: IngestRequest):
    if db_instance is None:
        raise HTTPException(status_code=503, detail="RAG engine is still initializing.")
    
    try:
        # 1. Create a Document
        metadata = {"source": request.source, "title": request.title}
        doc = Document(page_content=request.text, metadata=metadata)
        
        # 2. Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = text_splitter.split_documents([doc])
        
        # 3. Add to Chroma
        db_instance.add_documents(chunks)
        if hasattr(db_instance, 'persist'):
            db_instance.persist()
        print(f"Successfully ingested {len(chunks)} chunks from source: {request.source}")
        
        return {"status": "success", "chunks": len(chunks)}
    except Exception as e:
        print(f"Error during ingestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))
