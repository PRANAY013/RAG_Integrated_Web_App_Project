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

# LLAMAINDEX INTEGRATION - signature 5LINE

MODEL_GLOBAL = llama31_8

from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.groq import Groq

# local embeddings - no OpenAI dependency - hidden process
Settings.embed_model = HuggingFaceEmbedding (model_name="BAAI/bge-small-en-v1.5")
# model selection - can be done locally in function but openAI is being referenced
Settings.llm = Groq(model=MODEL_GLOBAL, api_key=GROQ_KEY)

def analyze_doc (file_path, question="summarize this document") :

    # model definition - groq api used here 
    # llm = Groq(model=MODEL_GLOBAL, api_key=GROQ_KEY) # globallyset
    documents = SimpleDirectoryReader(input_files = [file_path]).load_data()

    # llm context def - the user message query
    index = VectorStoreIndex.from_documents(documents)

    # RAG function - query the document
    query_engine = index.as_query_engine()
    response = query_engine.query(question)

    return str(response)

def test_analyze_doc () :

    result = analyze_doc(
        "testdoc.pdf",
        "What is machine learning and summarize this document",
    )

    print ("\n= = = = = = = = = = = = = = = = = = = =\nDocument Analysis Result: ")
    print (result)



# - - - - -

test_analyze_doc()