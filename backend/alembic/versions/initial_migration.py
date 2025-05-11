"""Initial migration

Revision ID: 76dc51eac6c7
Revises: 
Create Date: 2023-11-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '76dc51eac6c7'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create chats table
    op.create_table('chats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('is_archived', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_active', sa.DateTime(), nullable=True),
        sa.Column('preview', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chats_id'), 'chats', ['id'], unique=False)
    op.create_index(op.f('ix_chats_title'), 'chats', ['title'], unique=False)

    # Create documents table
    op.create_table('documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('size', sa.Integer(), nullable=True),
        sa.Column('pages', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('upload_date', sa.DateTime(), nullable=True),
        sa.Column('content_type', sa.String(), nullable=True),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
    op.create_index(op.f('ix_documents_name'), 'documents', ['name'], unique=False)

    # Create document_chat association table
    op.create_table('document_chat',
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('chat_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.PrimaryKeyConstraint('document_id', 'chat_id')
    )

    # Create document_content table
    op.create_table('document_content',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'page_number', name='uix_document_page')
    )
    op.create_index(op.f('ix_document_content_id'), 'document_content', ['id'], unique=False)

    # Create messages table
    op.create_table('messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('chat_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'], unique=False)

    # Create sources table
    op.create_table('sources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('page', sa.Integer(), nullable=True),
        sa.Column('highlight', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sources_id'), 'sources', ['id'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_sources_id'), table_name='sources')
    op.drop_table('sources')
    op.drop_index(op.f('ix_messages_id'), table_name='messages')
    op.drop_table('messages')
    op.drop_index(op.f('ix_document_content_id'), table_name='document_content')
    op.drop_table('document_content')
    op.drop_table('document_chat')
    op.drop_index(op.f('ix_documents_name'), table_name='documents')
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')
    op.drop_index(op.f('ix_chats_title'), table_name='chats')
    op.drop_index(op.f('ix_chats_id'), table_name='chats')
    op.drop_table('chats')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users') 