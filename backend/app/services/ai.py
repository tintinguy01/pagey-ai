import os
from typing import List, Dict, Any, Optional
import logging
import re
from difflib import SequenceMatcher
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.core.config import settings
from app.db.models import Chat, Document, DocumentContent, Message
from app.schemas.message import MessageCreate
from app.services.message import create_message, create_message_with_sources
from sqlalchemy.orm import Session
from langchain_core.documents import Document as LCDocument
import difflib

logger = logging.getLogger(__name__)

class PDFChatBot:
    def __init__(self, chat_id: int, db: Session):
        self.chat_id = chat_id
        self.db = db
        self.chat = db.query(Chat).filter(Chat.id == chat_id).first()
        self.documents = self.chat.documents if self.chat else []
        self.embeddings = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
        self.vectorstore = None
        self.retriever = None

        if self.documents:
            self._initialize_retrieval_chain()

    def _initialize_retrieval_chain(self):
        documents_text = []
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=100)
        for document in self.documents:
            document_contents = (
                self.db.query(DocumentContent)
                .filter(DocumentContent.document_id == document.id)
                .all()
            )
            for content in document_contents:
                if content.content:
                    cleaned_text = re.sub(r"Page \\d+ of \\d+", "", content.content)
                    cleaned_text = re.sub(r"\\s{2,}", " ", cleaned_text)
                    splits = text_splitter.split_text(cleaned_text)
                    for split in splits:
                        documents_text.append(
                            LCDocument(
                                page_content=split,
                                metadata={
                                    "document_id": document.id,
                                    "document_name": document.name,
                                    "page": content.page_number,
                                }
                            )
                        )
        if documents_text:
            self.vectorstore = FAISS.from_documents(documents_text, self.embeddings)
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 10})

    async def process_message(self, user_message: str) -> Dict[str, Any]:
        if not self.chat:
            raise ValueError(f"Chat with ID {self.chat_id} not found")

        self._initialize_retrieval_chain()

        relevant_docs = []
        if self.vectorstore:
            relevant_docs = self.vectorstore.max_marginal_relevance_search(
                user_message, k=10, fetch_k=20, lambda_mult=0.5
            )
            if not relevant_docs:
                relevant_docs = self.vectorstore.similarity_search(user_message, k=5)

        messages = (
            self.db.query(Message)
            .filter(Message.chat_id == self.chat_id)
            .order_by(Message.timestamp)
            .all()
        )

        chat_history = []
        for message in messages[-10:]:
            if message.role == "user":
                chat_history.append(HumanMessage(content=message.content))
            elif message.role == "assistant":
                chat_history.append(AIMessage(content=message.content))

        user_db_message = create_message(
            self.db,
            MessageCreate(chat_id=self.chat_id, content=user_message, role="user")
        )

        llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY, temperature=0.4, model="gpt-4o")

        system_prompt = (
            "You are a highly capable AI assistant analyzing the PDF documents uploaded to this chat.\n"
            "IMPORTANT: NEVER say phrases like 'I don't have access' or similar disclaimers. You DO have complete access to all uploaded documents.\n"
            "If you can't find specific information in the documents, say 'Based on the documents provided, I couldn't find specific information about X' instead.\n"
            "Always refer to the documents directly as if you've carefully analyzed them. Be specific about what you found in them.\n"
            "Respond with well-formatted markdown. Use headings, bullet points, and emojis where it enhances clarity.\n"
            "Be precise and concise. Extract only the most important ideas and summarize them clearly.\n"
            "When citing evidence, use exact quotes from the documents and refer to specific sections.\n"
            "Answer multiple questions separately with headings and dividers (---) for clarity.\n"
            "Use exact terminology from the documents to allow for proper highlighting.\n"
            "Be selective with citations - only refer to sources when directly quoting or paraphrasing specific content.\n"
            "End with a brief, helpful conclusion. Avoid generic advice unless specifically requested.\n"
        )

        condense_prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{question}")
        ])

        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=self.retriever,
            return_source_documents=True,
            verbose=True,
            condense_question_prompt=condense_prompt
        )

        try:
            result = qa_chain.invoke({"question": user_message, "chat_history": chat_history})
            answer = result["answer"]
            source_documents = result.get("source_documents", [])

            logger.warning("AI Final Answer Before Saving:\n" + answer)

            def extract_relevant_spans(answer: str, page_content: str):
                # Clean up answer and page_content for better matching
                answer_lower = answer.lower()
                
                # Split page content into paragraphs
                paragraphs = [p.strip() for p in re.split(r'\n{2,}', page_content) if p.strip()]
                
                relevant_spans = []
                
                # First try exact phrase matching for better highlighting precision
                for para in paragraphs:
                    para_clean = para.replace('\n', ' ').strip()
                    if len(para_clean) < 10:  # Skip very short segments
                        continue
                        
                    # Look for exact phrases (3+ words) from the paragraph in the answer
                    words = para_clean.lower().split()
                    if len(words) >= 3:
                        for i in range(len(words) - 2):
                            phrase = ' '.join(words[i:i+3])
                            if phrase in answer_lower and phrase not in [span.lower() for span in relevant_spans]:
                                relevant_spans.append(para)
                                break
                
                # If no exact matches, fall back to similarity-based matching
                if not relevant_spans:
                    for para in paragraphs:
                        para_clean = para.replace('\n', ' ').strip()
                        if len(para_clean) < 20:
                            continue
                            
                        # Count word matches between paragraph and answer
                        match_count = sum(1 for word in para_clean.lower().split() 
                                         if word.lower() in answer_lower and len(word) > 3)
                        match_ratio = match_count / max(1, len(para_clean.split()))
                        
                        # Add paragraph if it has significant word overlap with the answer
                        if match_ratio > 0.3 or para_clean.lower() in answer_lower:
                            relevant_spans.append(para)
                
                return relevant_spans

            # Extract and process key phrases from the answer for bi-directional highlighting
            def extract_key_phrases(text, min_length=4, max_phrases=15):
                # Split into sentences and clean up
                sentences = re.split(r'[.!?]', text)
                sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
                
                # Extract important phrases
                phrases = []
                for sentence in sentences:
                    # Extract 3-5 word phrases as potential highlights
                    words = sentence.split()
                    if len(words) >= 3:
                        for i in range(len(words) - 2):
                            # Get phrases of different lengths
                            for phrase_len in range(3, min(6, len(words) - i + 1)):
                                phrase = ' '.join(words[i:i+phrase_len])
                                if len(phrase) >= min_length and phrase.lower() not in [p.lower() for p in phrases]:
                                    phrases.append(phrase)
                
                # Return top phrases sorted by length (prefer longer phrases)
                return sorted(phrases[:max_phrases], key=len, reverse=True)
            
            # Extract key phrases from the AI's answer to use for bi-directional highlighting
            answer_key_phrases = extract_key_phrases(answer)
            
            # Filter sources to only include high-quality, truly relevant ones
            def is_high_quality_source(doc, page_content, highlights):
                # Skip if no clear highlights or content is too short
                if not highlights or len(page_content) < 50:
                    return False
                    
                # Ensure content has substantial matching with the answer
                has_significant_match = False
                for highlight in highlights:
                    if len(highlight) > 40:  # Only substantial highlights
                        has_significant_match = True
                        break
                        
                return has_significant_match
                
            # In the code where sources are processed:
            filtered_sources = []
            seen_pages = set()
            
            for doc in source_documents:
                metadata = doc.metadata
                doc_id, doc_name, page = metadata.get("document_id"), metadata.get("document_name"), metadata.get("page")
                
                if (doc_id, page) in seen_pages:
                    continue
                    
                seen_pages.add((doc_id, page))
                page_content = doc.page_content
                
                # Get relevant spans from the document
                highlights = extract_relevant_spans(answer, page_content)
                
                # Skip if this source isn't high quality
                if not is_high_quality_source(doc, page_content, highlights):
                    continue
                    
                highlight_text = '\n\n'.join(highlights) if highlights else (page_content[:200] + "..." if len(page_content) > 200 else page_content)
                
                # Find document phrases that appear in the answer
                doc_to_answer_matches = []
                for highlight in highlights:
                    for phrase in answer_key_phrases:
                        if phrase.lower() in highlight.lower():
                            doc_to_answer_matches.append(phrase)
                
                # Find answer phrases that appear in the document
                answer_to_doc_matches = []
                for phrase in answer_key_phrases:
                    if phrase.lower() in page_content.lower():
                        answer_to_doc_matches.append(phrase)
                
                # Combine both directions for better highlighting
                all_highlight_phrases = list(set(doc_to_answer_matches + answer_to_doc_matches))
                
                filtered_sources.append({
                    "document_id": doc_id,
                    "file": doc_name,
                    "page": page,
                    "highlight": highlight_text,
                    "highlights": highlights,
                    "content": highlight_text,
                    "key_phrases": all_highlight_phrases
                })
                
            # Limit sources to most relevant ones (max 4)
            filtered_sources = filtered_sources[:4]
            
            sources = filtered_sources
            
            # Use only the most relevant one if there's a fallback needed
            if not sources and source_documents:
                doc = source_documents[0]
                metadata = doc.metadata
                page_content = doc.page_content
                highlight = page_content[:200] + "..." if len(page_content) > 200 else page_content
                
                # Extract some key phrases for highlighting
                key_phrases = extract_key_phrases(answer)
                answer_phrases = [phrase for phrase in key_phrases if phrase.lower() in page_content.lower()]
                
                sources.append({
                    "document_id": metadata.get("document_id"),
                    "file": metadata.get("document_name", "Unknown"),
                    "page": metadata.get("page", 0),
                    "highlight": highlight,
                    "highlights": [highlight],
                    "content": highlight,
                    "key_phrases": answer_phrases
                })

            db_sources = [
                {
                    "document_id": s["document_id"],
                    "page": s["page"],
                    "highlight": s.get("highlight"),
                    "content": s.get("content"),
                    "key_phrases": s.get("key_phrases", [])  # Include key phrases in DB sources
                }
                for s in sources if "document_id" in s
            ]

            ai_db_message = create_message_with_sources(
                self.db,
                MessageCreate(chat_id=self.chat_id, content=answer, role="assistant"),
                db_sources
            )

            return {"id": ai_db_message.id, "content": answer, "role": "assistant", "sources": sources}

        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            ai_db_message = create_message(
                self.db,
                MessageCreate(chat_id=self.chat_id, content="I'm sorry, I encountered an error processing your request.", role="assistant")
            )
            return {"id": ai_db_message.id, "content": ai_db_message.content, "role": "assistant", "sources": []}
