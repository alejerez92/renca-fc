import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Obtener URL de la base de datos
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    print("Error: No se encontró DATABASE_URL")
    exit(1)

engine = create_engine(DATABASE_URL)

def repair_database():
    with engine.connect() as conn:
        print("Verificando y reparando todas las tablas...")
        
        # 1. Tabla Matches
        try:
            conn.execute(text("ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_day_id INTEGER REFERENCES match_days(id)"))
            conn.commit()
            print("- OK: matches.match_day_id")
        except Exception as e: print(f"- Error matches.match_day_id: {e}")

        # 2. Tabla Venues (EL ERROR ACTUAL)
        try:
            conn.execute(text("ALTER TABLE venues ADD COLUMN IF NOT EXISTS location VARCHAR"))
            conn.commit()
            print("- OK: venues.location")
        except Exception as e: print(f"- Error venues.location: {e}")

        # 3. Tabla Match Events
        try:
            conn.execute(text("ALTER TABLE match_events ADD COLUMN IF NOT EXISTS minute INTEGER DEFAULT 0"))
            conn.commit()
            print("- OK: match_events.minute")
        except Exception as e: print(f"- Error match_events.minute: {e}")

        # 4. Tabla Clubs
        try:
            conn.execute(text("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS league_series VARCHAR DEFAULT 'HONOR'"))
            conn.commit()
            print("- OK: clubs.league_series")
        except Exception as e: print(f"- Error clubs.league_series: {e}")

        # 5. Tabla Categories (Por si acaso)
        try:
            conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_category VARCHAR"))
            conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS points_win INTEGER DEFAULT 3"))
            conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS points_draw INTEGER DEFAULT 1"))
            conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS points_loss INTEGER DEFAULT 0"))
            conn.commit()
            print("- OK: categories columns")
        except Exception as e: print(f"- Error categories: {e}")

    print("Reparación TOTAL completada.")

if __name__ == "__main__":
    repair_database()
