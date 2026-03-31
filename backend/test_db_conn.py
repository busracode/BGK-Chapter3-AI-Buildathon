import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from urllib.parse import quote_plus

# Original password: [Allab€ni@5274]
# We need to quote it for the URL
user = "postgres"
password = "[Allab€ni@5274]"
hostSize = "db.udmmyiixjckmhsysvked.supabase.co:5432"
dbname = "postgres"

encoded_password = quote_plus(password)
url = f"postgresql+asyncpg://{user}:{encoded_password}@{hostSize}/{dbname}"

print(f"Testing URL: {url.replace(encoded_password, '****')}")

async def test_conn():
    engine = create_async_engine(url)
    try:
        async with engine.connect() as conn:
            print("Successfully connected to the database!")
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_conn())
