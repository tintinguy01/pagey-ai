# Import main services to make them available
from app.services.user import get_user_by_id, create_user_if_not_exists
from app.services.chat import get_chat_by_id, create_chat
from app.services.document import get_document_by_id
from app.services.message import get_messages_by_chat_id
from app.services.pdf import extract_pdf_content
from app.services.ai import PDFChatBot 