import os 
import random  
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
            "temperature" : 0.7       
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

from llama_index.core import get_response_synthesizer
from llama_index.core.response_synthesizers import ResponseMode

from llama_index.core.prompts import PromptTemplate
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SimilarityPostprocessor


# local embeddings - no OpenAI dependency - hidden process
Settings.embed_model = HuggingFaceEmbedding (model_name="BAAI/bge-large-en-v1.5")
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

# Smart query classification 
def classify_query(query: str) -> str:
    """
    Comprehensive query classification using NLP techniques and pattern matching.
    Based on research in query intent detection and user behavior analysis.
    """
    query_lower = query.lower().strip()
    
    # Handle empty or very short queries
    if len(query_lower) < 2:
        return "unclear"
    
    # Advanced greeting detection with variations and multilingual support
    greeting_indicators = [
        # English greetings
        "hi", "hello", "hey", "hiya", "howdy", "greetings", "salutations",
        "good morning", "good afternoon", "good evening", "good day", "good night",
        "what's up", "whats up", "sup", "yo", "wassup", "hey there", "hi there",
        "hello there", "morning", "afternoon", "evening", "how are you", "how's it going",
        "how you doing", "nice to meet you", "pleasure to meet you", "welcome",
        
        # Casual and informal
        "heya", "heyo", "yooo", "heyy", "hiii", "helloo", "what up", "wazzup",
        "how's things", "how are things", "how's life", "long time no see",
        "good to see you", "great to see you", "nice seeing you",
        
        # Multilingual greetings
        "hola", "bonjour", "guten tag", "konnichiwa", "namaste", "shalom", "aloha",
        "ciao", "buenos dias", "buenas tardes", "buenas noches", "bom dia",
        "guten morgen", "guten abend", "ohayo", "konbanwa", "ni hao", "annyeong",
        "sawasdee", "xin chao", "merhaba", "zdravstvuyte", "dzien dobry",
        
        # Regional and cultural
        "top of the morning", "g'day", "cheerio", "how do you do", "salaam",
        "jambo", "sawubona", "dumela", "habari", "asante", "karibu"
    ]
    
    # Comprehensive farewell detection
    farewell_indicators = [
        # Standard farewells
        "bye", "goodbye", "see you", "farewell", "take care", "catch you later",
        "until next time", "talk to you later", "ttyl", "cya", "peace out",
        "have a good day", "have a nice day", "good night", "goodnight",
        
        # Extended farewells
        "see you soon", "see you around", "see you tomorrow", "see you next time",
        "until we meet again", "until later", "until then", "so long", "adios",
        "au revoir", "auf wiedersehen", "sayonara", "ciao", "arrivederci",
        "hasta la vista", "hasta luego", "see ya", "later", "laters",
        
        # Casual and informal
        "gotta go", "got to go", "gotta run", "got to run", "i'm out", "im out",
        "i'm off", "im off", "time to go", "heading out", "signing off",
        "logging off", "peace", "peaceout", "deuces", "catch ya", "later gator",
        
        # Polite endings
        "have a great day", "have a wonderful day", "have a good one",
        "have a nice evening", "have a good night", "sleep well", "sweet dreams",
        "take it easy", "stay safe", "be well", "all the best", "best wishes",
        "keep in touch", "stay in touch", "talk soon", "speak soon"
    ]
    
    # Advanced help request detection with context awareness
    help_indicators = [
        # Direct help requests
        "help", "assist", "support", "guide", "show me", "teach me", "help me",
        "can you help", "could you help", "would you help", "please help",
        "i need help", "need assistance", "need support", "need guidance",
        
        # Uncertainty expressions
        "what do i do", "what should i do", "how do i", "how can i", "how to",
        "i'm stuck", "im stuck", "i don't know", "i dont know", "not sure",
        "confused", "lost", "puzzled", "perplexed", "bewildered", "baffled",
        "clueless", "stumped", "at a loss", "no idea", "haven't a clue",
        
        # Guidance requests
        "what now", "next steps", "guidance", "direction", "advice", "suggestions",
        "instructions", "tutorial", "walkthrough", "explain how", "show how",
        "walk me through", "step by step", "how does this work", "how do you",
        
        # Learning requests
        "teach me how", "learn how to", "want to learn", "need to understand",
        "explain to me", "break it down", "make it simple", "simplify",
        "clarify", "elaborate", "expand on", "tell me more", "more details",
        
        # Problem-solving
        "figure out", "work out", "solve this", "find a solution", "resolve",
        "troubleshoot", "debug", "fix this", "make it work", "get this working",
        "having trouble", "having issues", "having problems", "struggling with"
    ]
    
    # Enhanced creative request detection
    creative_indicators = [
        # Core creativity terms
        "creative", "ideas", "brainstorm", "suggest", "inspiration", "innovative",
        "think of", "come up with", "generate", "create", "design", "invent",
        "imagine", "conceptualize", "dream up", "craft", "build", "make",
        "artistic", "original", "unique", "novel", "fresh", "new approach",
        
        # Creative processes
        "out of the box", "think outside", "creative thinking", "lateral thinking",
        "innovative solutions", "creative solutions", "new ideas", "fresh ideas",
        "original ideas", "unique concepts", "novel approaches", "creative ways",
        "alternative methods", "different approaches", "unconventional",
        
        # Content creation
        "creative writing", "story ideas", "plot", "character", "narrative",
        "storyline", "script", "screenplay", "poem", "poetry", "lyrics",
        "song ideas", "music composition", "art project", "design concept",
        "visual design", "graphic design", "logo design", "brand identity",
        
        # Innovation and invention
        "innovate", "pioneer", "breakthrough", "revolutionary", "cutting edge",
        "state of the art", "next generation", "futuristic", "visionary",
        "groundbreaking", "game changing", "disruptive", "transformative",
        
        # Artistic expressions
        "artistic vision", "creative expression", "aesthetic", "beautiful",
        "elegant", "stylish", "trendy", "fashionable", "contemporary",
        "modern", "abstract", "minimalist", "maximalist", "eclectic",
        
        # Collaboration and ideation
        "brainstorming session", "idea generation", "creative collaboration",
        "team creativity", "group thinking", "collective intelligence",
        "crowdsourcing ideas", "mind mapping", "thought experiment"
    ]
    
    # Comprehensive comparison and analysis requests
    comparison_indicators = [
        # Direct comparisons
        "compare", "versus", "vs", "v/s", "difference", "similar", "contrast",
        "better than", "worse than", "superior to", "inferior to", "against",
        "compared to", "in comparison", "side by side", "head to head",
        
        # Evaluation terms
        "pros and cons", "advantages", "disadvantages", "benefits", "drawbacks",
        "strengths", "weaknesses", "upsides", "downsides", "trade offs",
        "trade-offs", "cost benefit", "risk reward", "risk-reward",
        
        # Decision making
        "which is better", "what's the difference", "whats the difference",
        "which should i choose", "which one", "what's best", "whats best",
        "recommend", "recommendation", "suggest", "advice", "opinion",
        
        # Analysis terms
        "analyze", "analysis", "evaluation", "assessment", "review", "critique",
        "examination", "study", "investigation", "research", "survey",
        "rank", "ranking", "rating", "score", "grade", "benchmark",
        
        # Competitive analysis
        "competitive analysis", "market comparison", "feature comparison",
        "price comparison", "performance comparison", "quality comparison",
        "value proposition", "competitive advantage", "market position",
        
        # Decision frameworks
        "decision matrix", "criteria", "factors", "considerations", "variables",
        "parameters", "metrics", "kpis", "key performance indicators",
        "success factors", "critical factors", "determining factors"
    ]
    
    # Advanced transactional intent detection
    transactional_indicators = [
        # Purchase intent
        "buy", "purchase", "order", "shop", "shopping", "acquire", "get",
        "obtain", "procure", "invest in", "spend on", "pay for", "book",
        "reserve", "subscribe", "sign up", "register", "enroll",
        
        # Pricing and cost
        "price", "cost", "how much", "how much does", "pricing", "rates",
        "fees", "charges", "expense", "budget", "affordable", "cheap",
        "expensive", "costly", "value", "worth", "investment", "roi",
        
        # Shopping behavior
        "where to buy", "where can i buy", "store", "shop", "retailer",
        "vendor", "supplier", "marketplace", "online store", "e-commerce",
        "discount", "deal", "sale", "offer", "promotion", "coupon",
        "bargain", "clearance", "markdown", "special offer",
        
        # Financial transactions
        "payment", "checkout", "cart", "basket", "wishlist", "compare prices",
        "best price", "lowest price", "cheapest", "most affordable",
        "financing", "installments", "payment plan", "credit", "loan",
        
        # Product research
        "recommendation", "best", "top rated", "highly rated", "reviews",
        "testimonials", "user reviews", "customer reviews", "ratings",
        "quality", "reliable", "durable", "warranty", "guarantee",
        
        # Commercial intent
        "commercial", "business", "enterprise", "professional", "premium",
        "subscription", "membership", "plan", "package", "bundle",
        "upgrade", "downgrade", "trial", "free trial", "demo"
    ]
    
    # Comprehensive informational query detection
    informational_indicators = [
        # Question words
        "what is", "what are", "what does", "what means", "what's the",
        "who is", "who are", "who was", "who were", "whose", "whom",
        "when did", "when was", "when were", "when will", "when does",
        "where is", "where are", "where was", "where were", "where can",
        "why", "why is", "why are", "why does", "why did", "why would",
        "how", "how does", "how do", "how did", "how can", "how will",
        "how many", "how much", "how often", "how long", "how far",
        
        # Definition and explanation
        "define", "definition", "meaning", "means", "explain", "describe",
        "elaborate", "clarify", "illustrate", "demonstrate", "show",
        "tell me about", "information about", "details about", "facts about",
        "data about", "statistics about", "numbers about", "figures about",
        
        # Knowledge seeking
        "history of", "background", "context", "origin", "source", "cause",
        "reason", "purpose", "function", "role", "importance", "significance",
        "overview", "summary", "synopsis", "abstract", "introduction",
        "basics", "fundamentals", "essentials", "key points", "main points",
        
        # Academic and scientific
        "concept", "theory", "principle", "rule", "law", "formula", "equation",
        "method", "process", "procedure", "technique", "approach", "strategy",
        "framework", "model", "system", "structure", "organization",
        
        # Research and investigation
        "research", "study", "investigation", "analysis", "examination",
        "exploration", "discovery", "findings", "results", "conclusions",
        "evidence", "proof", "documentation", "reference", "citation",
        
        # Learning and understanding
        "understand", "comprehend", "grasp", "learn", "know", "realize",
        "recognize", "identify", "distinguish", "differentiate", "categorize",
        "classify", "organize", "structure", "arrange", "order"
    ]
    
    # Enhanced document-specific detection
    doc_indicators = [
        # File types
        "document", "pdf", "file", "doc", "docx", "txt", "text file",
        "spreadsheet", "excel", "xls", "xlsx", "csv", "presentation",
        "powerpoint", "ppt", "pptx", "slide", "slides", "image", "photo",
        "picture", "jpeg", "jpg", "png", "gif", "bmp", "tiff",
        
        # Document references
        "uploaded", "attached", "this document", "this file", "the document",
        "the file", "attachment", "enclosure", "appendix", "exhibit",
        "report", "paper", "article", "manuscript", "thesis", "dissertation",
        "essay", "proposal", "contract", "agreement", "policy", "manual",
        
        # Content types
        "text", "content", "material", "data", "information", "details",
        "resume", "cv", "curriculum vitae", "portfolio", "profile",
        "biography", "bio", "background", "credentials", "qualifications",
        "experience", "skills", "education", "achievements", "accomplishments",
        
        # Document actions
        "read", "review", "analyze", "examine", "study", "parse", "extract",
        "summarize", "outline", "highlight", "annotate", "comment", "edit",
        "revise", "update", "modify", "change", "correct", "proofread",
        
        # Document structure
        "page", "pages", "section", "chapter", "paragraph", "sentence",
        "line", "word", "heading", "title", "subtitle", "header", "footer",
        "table", "chart", "graph", "figure", "diagram", "illustration"
    ]
    
    # Advanced conversational patterns
    conversational_indicators = [
        # Gratitude and appreciation
        "thank you", "thanks", "thank", "appreciate", "grateful", "gratitude",
        "much appreciated", "thanks a lot", "thank you so much", "many thanks",
        "thanks again", "appreciate it", "appreciate that", "very grateful",
        
        # Positive feedback
        "awesome", "great", "excellent", "wonderful", "amazing", "fantastic",
        "perfect", "brilliant", "outstanding", "superb", "magnificent",
        "marvelous", "incredible", "unbelievable", "impressive", "remarkable",
        "extraordinary", "phenomenal", "spectacular", "fabulous", "terrific",
        
        # Apologies and corrections
        "sorry", "apologize", "apologies", "my bad", "my mistake", "oops",
        "mistake", "error", "wrong", "incorrect", "inaccurate", "misunderstood",
        "clarification", "correction", "fix", "adjust", "modify", "revise",
        
        # Politeness markers
        "please", "could you", "would you", "can you", "may i", "might i",
        "if you don't mind", "if possible", "when convenient", "at your convenience",
        "kindly", "gently", "politely", "respectfully", "humbly",
        
        # Opinion and belief
        "i think", "i believe", "i feel", "i suppose", "i assume", "i guess",
        "in my opinion", "personally", "from my perspective", "in my view",
        "as i see it", "it seems to me", "i would say", "i consider",
        "actually", "honestly", "frankly", "to be honest", "truthfully",
        
        # Agreement and disagreement
        "agree", "disagree", "absolutely", "definitely", "certainly", "exactly",
        "precisely", "indeed", "of course", "naturally", "obviously", "clearly",
        "no doubt", "without question", "undoubtedly", "surely", "yes", "no",
        
        # Emotional expressions
        "excited", "thrilled", "delighted", "pleased", "happy", "glad",
        "satisfied", "content", "disappointed", "frustrated", "confused",
        "surprised", "shocked", "amazed", "impressed", "concerned", "worried"
    ]
    
    # Technical and troubleshooting queries
    technical_indicators = [
        # Problem identification
        "error", "bug", "issue", "problem", "fault", "defect", "glitch",
        "malfunction", "failure", "breakdown", "crash", "freeze", "hang",
        "slow", "sluggish", "lag", "delay", "timeout", "unresponsive",
        "not working", "broken", "damaged", "corrupted", "failed",
        
        # Solution seeking
        "fix", "solve", "resolve", "repair", "troubleshoot", "debug",
        "diagnose", "identify", "locate", "find", "detect", "discover",
        "remedy", "correct", "address", "handle", "deal with", "work around",
        
        # System operations
        "install", "uninstall", "setup", "configure", "settings", "options",
        "preferences", "parameters", "properties", "attributes", "features",
        "functions", "capabilities", "specifications", "requirements",
        
        # Updates and maintenance
        "update", "upgrade", "downgrade", "patch", "hotfix", "rollback",
        "restore", "backup", "recovery", "maintenance", "optimization",
        "performance", "speed", "efficiency", "reliability", "stability",
        
        # Compatibility and integration
        "compatibility", "compatible", "support", "supported", "integration",
        "interface", "api", "connection", "connectivity", "network",
        "protocol", "standard", "format", "encoding", "decoding",
        
        # Technical specifications
        "version", "build", "release", "edition", "variant", "model",
        "type", "category", "class", "architecture", "platform", "framework",
        "library", "module", "component", "dependency", "requirement"
    ]
    
    # Educational and learning queries
    educational_indicators = [
        # Learning activities
        "learn", "study", "understand", "comprehend", "grasp", "master",
        "acquire", "develop", "improve", "enhance", "strengthen", "build",
        "practice", "exercise", "drill", "rehearse", "review", "revise",
        
        # Educational contexts
        "course", "class", "lesson", "lecture", "seminar", "workshop",
        "tutorial", "training", "instruction", "teaching", "coaching",
        "mentoring", "guidance", "supervision", "education", "learning",
        
        # Academic institutions
        "school", "university", "college", "institute", "academy", "campus",
        "classroom", "laboratory", "library", "department", "faculty",
        "academic", "scholarly", "educational", "pedagogical", "curricular",
        
        # Research and scholarship
        "research", "study", "investigation", "analysis", "thesis", "dissertation",
        "paper", "publication", "journal", "article", "book", "textbook",
        "reference", "citation", "bibliography", "literature", "sources",
        
        # Assessment and evaluation
        "assignment", "homework", "project", "task", "exercise", "activity",
        "exam", "test", "quiz", "assessment", "evaluation", "grading",
        "grade", "score", "mark", "result", "performance", "achievement",
        
        # Credentials and certification
        "certificate", "certification", "diploma", "degree", "qualification",
        "credential", "license", "accreditation", "recognition", "award",
        "honor", "distinction", "merit", "excellence", "achievement",
        
        # Skills and competencies
        "skill", "ability", "competency", "proficiency", "expertise", "knowledge",
        "understanding", "capability", "talent", "aptitude", "potential",
        "development", "growth", "progress", "advancement", "improvement"
    ]
    
    # Personal and lifestyle queries
    personal_indicators = [
        # Personal pronouns and references
        "my", "mine", "myself", "i am", "i'm", "i was", "i have", "i've",
        "i will", "i'll", "i would", "i'd", "i should", "i could", "i can",
        "personal", "private", "individual", "own", "self", "me", "myself",
        
        # Lifestyle and habits
        "lifestyle", "life", "living", "habit", "habits", "routine", "daily",
        "schedule", "time management", "organization", "planning", "goals",
        "objectives", "targets", "aspirations", "dreams", "wishes", "hopes",
        
        # Health and wellness
        "health", "healthy", "wellness", "wellbeing", "fitness", "exercise",
        "workout", "training", "diet", "nutrition", "eating", "food",
        "sleep", "rest", "relaxation", "stress", "anxiety", "depression",
        "mental health", "physical health", "medical", "doctor", "treatment",
        
        # Relationships and social
        "relationship", "relationships", "family", "friends", "social",
        "dating", "marriage", "partner", "spouse", "children", "kids",
        "parents", "siblings", "relatives", "community", "network",
        "communication", "interaction", "connection", "bond", "love",
        
        # Career and work
        "career", "job", "work", "employment", "profession", "occupation",
        "business", "company", "organization", "workplace", "office",
        "salary", "income", "money", "finance", "financial", "budget",
        "savings", "investment", "retirement", "promotion", "advancement",
        
        # Hobbies and interests
        "hobby", "hobbies", "interest", "interests", "passion", "passions",
        "activity", "activities", "recreation", "entertainment", "fun",
        "enjoyment", "pleasure", "satisfaction", "fulfillment", "happiness",
        "joy", "excitement", "enthusiasm", "motivation", "inspiration",
        
        # Personal development
        "growth", "development", "improvement", "progress", "change",
        "transformation", "evolution", "journey", "path", "direction",
        "purpose", "meaning", "values", "beliefs", "principles", "ethics",
        "character", "personality", "identity", "self-awareness", "mindfulness"
    ]

    # 1. HIGHEST PRIORITY: Exact phrase matches
    if any(greeting in query_lower for greeting in greeting_indicators):
        return "greeting"
    if any(farewell in query_lower for farewell in farewell_indicators):
        return "farewell"
    # 2. SPECIFIC INTENT: Help requests (before general)
    if any(help_ind in query_lower for help_ind in help_indicators):
        return "help_request"
    # 3. CREATIVE AND COMPARISON (specific patterns)
    if any(creative_ind in query_lower for creative_ind in creative_indicators):
        return "creative"
    if any(comp_ind in query_lower for comp_ind in comparison_indicators):
        return "comparison"
    # 4. TECHNICAL (before general informational)
    if any(tech_ind in query_lower for tech_ind in technical_indicators):
        return "technical"
    # 5. TRANSACTIONAL (specific commercial intent)
    if any(trans_ind in query_lower for trans_ind in transactional_indicators):
        return "transactional"
    # 6. DOCUMENT AND INFORMATIONAL ANALYSIS
    has_informational = any(info_ind in query_lower for info_ind in informational_indicators)
    has_document_ref = any(doc_ind in query_lower for doc_ind in doc_indicators)
    if has_informational and has_document_ref:
        return "hybrid"
    elif has_informational:
        return "general"
    # 7. EDUCATIONAL (after informational to avoid conflicts)
    if any(edu_ind in query_lower for edu_ind in educational_indicators):
        return "educational"
    # 8. PERSONAL (lowest priority for overlapping words)
    if any(pers_ind in query_lower for pers_ind in personal_indicators):
        return "personal"
    # 9. CONVERSATIONAL
    if any(conv_ind in query_lower for conv_ind in conversational_indicators):
        return "conversational"
    # 10. DOCUMENT-SPECIFIC
    if has_document_ref:
        return "document_specific"
    # 11. FALLBACKS
    if len(query_lower.split()) < 3:
        return "unclear"
    
    return "general"



# Enhanced prompt templates - ADD AFTER classify_query FUNCTION
SMART_QA_PROMPT = PromptTemplate(
    "You are an intelligent AI assistant with access to document context and general knowledge.\n"
    "Context information from documents is provided below:\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Instructions:\n"
    "1. If the context contains relevant information, use it as your primary source\n"
    "2. If the context is insufficient but you have general knowledge, supplement appropriately\n"
    "3. For general knowledge questions not covered in documents, provide comprehensive answers\n"
    "4. Always be specific, detailed, and cite sources when using document context\n"
    "5. Explain your reasoning and provide examples when helpful\n\n"
    "Query: {query_str}\n"
    "Provide a comprehensive, intelligent response:\n"
)

REFINE_PROMPT = PromptTemplate(
    "You are refining an answer based on additional context.\n"
    "Original query: {query_str}\n"
    "Existing answer: {existing_answer}\n"
    "Additional context: {context_msg}\n"
    "Refine the answer to be more comprehensive and accurate. "
    "Integrate new information seamlessly and maintain coherence.\n"
    "Refined answer:"
)


from llama_index.core.response_synthesizers import ResponseMode
from llama_index.core.node_parser import SentenceWindowNodeParser
from llama_index.core.postprocessor import MetadataReplacementPostProcessor


# Smart document processing function - REPLACES EXISTING create_enhanced_index
def create_smart_index(docs):
    """Create an intelligent index with advanced processing"""
    
    # Enhanced node parsing with larger windows for better context
    node_parser = SentenceWindowNodeParser.from_defaults(
        window_size=5,  # Increased from 3
        window_metadata_key="window",
        original_text_metadata_key="original_text"
    )
    
    nodes = node_parser.get_nodes_from_documents(docs)
    index = VectorStoreIndex(nodes)
    
    # Smart retriever with higher similarity threshold
    retriever = VectorIndexRetriever(
        index=index,
        similarity_top_k=5,  # Increased from 3
    )
    
    # Enhanced response synthesizer
    response_synthesizer = get_response_synthesizer(
        response_mode=ResponseMode.REFINE,
        streaming=False,  # Disable streaming for better quality
        use_async=True
    )
    
    # Smart post-processing
    postprocessors = [
        SimilarityPostprocessor(similarity_cutoff=0.6),  # Filter low-quality matches
        MetadataReplacementPostProcessor(target_metadata_key="window")
    ]
    
    # Create intelligent query engine
    query_engine = RetrieverQueryEngine.from_args(
        retriever=retriever,
        response_synthesizer=response_synthesizer,
        node_postprocessors=postprocessors
    )
    
    # Apply smart prompts
    query_engine.update_prompts({
        "response_synthesizer:text_qa_template": SMART_QA_PROMPT,
        "response_synthesizer:refine_template": REFINE_PROMPT
    })
    
    return index, query_engine



# Initialize documents only if directory has files
try:
    documents = SimpleDirectoryReader(input_dir=str(documents_path)).load_data()
    if documents:
        # Updated initialization
        index, query_engine = create_smart_index(documents)
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
        global documents, index, response_synthesizer, query_engine
        documents = SimpleDirectoryReader(input_dir=str(documents_path)).load_data()
        
        # Recreate index

        # Updated initialization
        index, query_engine = create_smart_index(documents)
        
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
        
        # Smart query classification
        query_type = classify_query(request.query)
        print(f"🧠 Query classified as: {query_type}")
        
        global documents, index, query_engine
        
        # Handle general knowledge queries directly when no documents available
        # Handle greetings with personalized and contextual responses

        if query_type not in ["greeting", "farewell", "help_request", "creative", "comparison", 
                      "conversational", "unclear", "general", "technical", "educational", 
                      "personal", "transactional", "hybrid", "document_specific"]:
            print(f"⚠️ Unhandled query type: {query_type}, defaulting to general knowledge")
            query_type = "general"
            
        if query_type == "greeting":
            greeting_responses = [
                "Hello! I'm your intelligent AI assistant, ready to help you explore knowledge and analyze your documents. What would you like to discover today?",
                "Hi there! I'm here to assist you with document analysis, answer questions, and provide insights. How can I help you?",
                "Greetings! I'm your AI companion for research, analysis, and knowledge exploration. What's on your mind?",
                "Welcome! I'm equipped to help you with document queries, general knowledge, creative brainstorming, and much more. What can I do for you?"
            ]
            
            selected_response = random.choice(greeting_responses)
            
            return QueryResponse(
                response=selected_response,
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Handle farewell messages
        if query_type == "farewell":
            farewell_responses = [
                "Goodbye! It was great helping you today. Feel free to return anytime you need assistance with documents or have questions!",
                "Take care! I'm always here when you need help with analysis, research, or just want to chat about interesting topics.",
                "Until next time! Remember, I'm here 24/7 for all your document analysis and knowledge needs.",
                "Farewell! Thanks for the engaging conversation. Come back anytime for more insights and assistance!"
            ]
            
            selected_response = random.choice(farewell_responses)
            
            return QueryResponse(
                response=selected_response,
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Enhanced help requests with comprehensive guidance
        if query_type == "help_request":
            help_response = """I'm here to provide comprehensive assistance! Here's what I can help you with:

        📄 **Document Analysis & Research**
        • Summarize and analyze uploaded documents (PDFs, reports, papers)
        • Extract key information and insights from your files
        • Answer specific questions about document content
        • Compare information across multiple documents

        🧠 **Knowledge & Information**
        • Answer factual questions on any topic
        • Provide detailed explanations of concepts
        • Offer historical context and background information
        • Define terms and explain complex ideas

        💡 **Creative & Brainstorming**
        • Generate creative ideas and solutions
        • Help with writing and content creation
        • Provide inspiration for projects
        • Assist with problem-solving approaches

        🔍 **Research & Analysis**
        • Conduct comparative analysis
        • Provide pros and cons evaluations
        • Help with decision-making processes
        • Offer different perspectives on topics

        🛠️ **Technical Support**
        • Troubleshoot issues and problems
        • Explain technical concepts
        • Provide step-by-step guidance
        • Help with learning new skills

        **How to get the best results:**
        • Be specific about what you need
        • Ask follow-up questions for clarification
        • Upload relevant documents for analysis
        • Feel free to ask for examples or elaboration

        What specific area would you like help with today?"""
            
            return QueryResponse(
                response=help_response,
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Enhanced creative requests with structured brainstorming
        if query_type == "creative":
            enhanced_prompt = f"""
            You are a highly creative AI assistant specializing in innovative thinking and brainstorming. 
            The user is seeking creative ideas, inspiration, or innovative solutions.
            
            Provide a comprehensive creative response that includes:
            1. Multiple diverse and original ideas
            2. Practical implementation suggestions
            3. Creative variations and alternatives
            4. Inspiration sources and references
            5. Next steps for development
            
            User's creative request: {request.query}
            
            Deliver an inspiring, actionable, and comprehensive creative response:
            """
            
            direct_response = Settings.llm.complete(enhanced_prompt)
            return QueryResponse(
                response=str(direct_response),
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Handle comparison requests
        if query_type == "comparison":
            comparison_prompt = f"""
            You are an analytical AI assistant specializing in comparative analysis.
            Provide a comprehensive comparison that includes:
            1. Key similarities and differences
            2. Pros and cons of each option
            3. Use cases and scenarios
            4. Recommendations based on different needs
            5. Summary with clear conclusions
            
            Comparison request: {request.query}
            
            Provide a detailed comparative analysis:
            """
            
            direct_response = Settings.llm.complete(comparison_prompt)
            return QueryResponse(
                response=str(direct_response),
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )
        
        # Handle technical queries
        if query_type == "technical":
            technical_prompt = f"""
            You are a technical support specialist. Provide detailed technical guidance and solutions.
            Address the technical issue comprehensively with troubleshooting steps and explanations.
            
            Technical query: {request.query}
            
            Provide comprehensive technical assistance:
            """
            
            direct_response = Settings.llm.complete(technical_prompt)
            return QueryResponse(
                response=str(direct_response),
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Handle educational queries
        if query_type == "educational":
            educational_prompt = f"""
            You are an educational instructor. Provide comprehensive learning guidance and information.
            Structure your response to be educational, informative, and easy to understand.
            
            Educational query: {request.query}
            
            Provide detailed educational content:
            """
            
            direct_response = Settings.llm.complete(educational_prompt)
            return QueryResponse(
                response=str(direct_response),
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Handle personal queries
        if query_type == "personal":
            personal_prompt = f"""
            You are a personal advisor and coach. Provide helpful, personalized guidance and recommendations.
            Address the personal aspect of the query with empathy and practical advice.
            
            Personal query: {request.query}
            
            Provide personalized guidance and recommendations:
            """
            
            direct_response = Settings.llm.complete(personal_prompt)
            return QueryResponse(
                response=str(direct_response),
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Handle transactional queries
        if query_type == "transactional":
            transactional_prompt = f"""
            You are a shopping and purchasing advisor. Provide helpful guidance about products, services, and purchasing decisions.
            Include recommendations, comparisons, and practical purchasing advice.
            
            Transactional query: {request.query}
            
            Provide comprehensive purchasing guidance:
            """
            
            direct_response = Settings.llm.complete(transactional_prompt)
            return QueryResponse(
                response=str(direct_response),
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Handle conversational responses
        if query_type == "conversational":
            conversational_prompt = f"""
            You are a friendly, conversational AI assistant. Respond naturally and engagingly to the user's message.
            Maintain a helpful and positive tone while being informative.
            
            User message: {request.query}
            
            Provide a natural, conversational response:
            """
            
            direct_response = Settings.llm.complete(conversational_prompt)
            return QueryResponse(
                response=str(direct_response),
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # Handle unclear queries with clarification requests
        if query_type == "unclear":
            clarification_response = """I'd be happy to help, but I need a bit more information to provide the best assistance. 
            Could you please:
            • Be more specific about what you're looking for
            • Provide more context about your question
            • Let me know if you're asking about a particular document or topic
            • Clarify what type of help you need

            For example, you could ask:
            • "Explain the concept of machine learning"
            • "Summarize the main points in my uploaded document"
            • "Help me brainstorm ideas for a creative project"
            • "Compare the advantages of different approaches"

            What would you like to know more about?"""
            
            return QueryResponse(
                response=clarification_response,
                sources=[],
                model_used=MODEL_GLOBAL,
                processing_time=time.time() - start_time
            )

        # ADD THIS MISSING GENERAL KNOWLEDGE HANDLER ⬇️
        if query_type == "general":
            print("🔄 Processing general knowledge query directly...")
            
            enhanced_prompt = f"""
            You are a knowledgeable AI assistant. Provide a comprehensive, detailed answer to this question.
            Be specific, include examples, and explain concepts clearly.
            
            Question: {request.query}
            
            Provide a thorough response:
            """
            
            try:
                # Use direct LLM call for general knowledge
                direct_response = Settings.llm.complete(enhanced_prompt)
                processing_time = time.time() - start_time
                
                # Debug: Check if response is empty
                print(f"DEBUG: Direct LLM response: {str(direct_response)[:100]}...")
                
                if not str(direct_response).strip():
                    # Fallback if response is empty
                    try:
                        groq_client = GroqClient(GROQ_KEY)
                        direct_response = groq_client.chat(request.query, model=MODEL_GLOBAL)
                    except Exception as groq_error:
                        print(f"GroqClient also failed: {groq_error}")
                        direct_response = "I apologize, but I'm having trouble processing your question right now."
                
                return QueryResponse(
                    response=str(direct_response),
                    sources=[],
                    model_used=MODEL_GLOBAL,
                    processing_time=processing_time
                )
            except Exception as e:
                print(f"❌ Direct LLM call failed: {e}")
                # Fallback response
                return QueryResponse(
                    response="I apologize, but I'm having trouble processing your general knowledge question right now.",
                    sources=[],
                    model_used=MODEL_GLOBAL,
                    processing_time=time.time() - start_time
                )


        # Initialize RAG system if needed
        if query_engine is None:
            try:
                print("🔄 Initializing smart RAG system...")
                documents = SimpleDirectoryReader(input_dir=str(documents_path)).load_data()
                if not documents:
                    raise HTTPException(
                        status_code=503, 
                        detail="No documents available. Please upload documents first."
                    )
                index, query_engine = create_smart_index(documents)  # Using smart index
                print(f"✅ Smart RAG system initialized with {len(documents)} documents")
            except Exception as init_error:
                print(f"❌ RAG initialization error: {str(init_error)}")
                raise HTTPException(
                    status_code=503,
                    detail=f"Failed to initialize RAG system: {str(init_error)}"
                )

        print(f"🔍 Processing {query_type} query: {request.query[:50]}...")
        
        # Enhanced query processing with retry logic
        max_retries = 2
        response = None
        for attempt in range(max_retries):
            try:
                response = query_engine.query(request.query)
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                print(f"⚠️ Query attempt {attempt + 1} failed, retrying...")
                time.sleep(1)
        
        processing_time = time.time() - start_time

        # Enhanced source processing (keep your existing source processing logic)
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
            enhanced_sources = []

        print(f"✅ Smart query processed successfully in {processing_time:.2f}s")
        
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


