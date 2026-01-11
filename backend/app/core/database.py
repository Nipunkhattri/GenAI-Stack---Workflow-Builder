from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings
from urllib.parse import urlparse, quote_plus, urlunparse

settings = get_settings()


def get_async_database_url():
    """Build async database URL with properly encoded credentials."""
    url = settings.database_url
    
    if not url or url == "":
        return None
    
    if "sqlite" in url:
        return url
    
    parsed = urlparse(url)
    
    if parsed.password:
        encoded_password = quote_plus(parsed.password)
        if parsed.port:
            netloc = f"{parsed.username}:{encoded_password}@{parsed.hostname}:{parsed.port}"
        else:
            netloc = f"{parsed.username}:{encoded_password}@{parsed.hostname}"
        
        url = urlunparse((
            parsed.scheme,
            netloc,
            parsed.path,
            parsed.params,
            "",
            parsed.fragment
        ))
    
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    
    return url


database_url = get_async_database_url()

if database_url:
    if "sqlite" in database_url:
        engine = create_async_engine(database_url, echo=False)
    else:
        ssl_enabled = settings.database_ssl
        
        connect_args = {}
        if ssl_enabled:
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connect_args["ssl"] = ssl_context
        else:
            connect_args["ssl"] = False
            
        engine = create_async_engine(
            database_url,
            echo=False,
            connect_args=connect_args
        )
    
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
else:
    engine = None
    async_session = None


class Base(DeclarativeBase):
    pass


async def get_db():
    if async_session is None:
        raise Exception("Database not configured")
    
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    if engine is None:
        print("Warning: Database not configured, skipping initialization")
        return
    
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
