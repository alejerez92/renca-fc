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
        print("Verificando y reparando tablas...")
        
        # 1. Agregar columna match_day_id a la tabla matches si no existe
        try:
            conn.execute(text("ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_day_id INTEGER REFERENCES match_days(id)"))
            conn.commit()
            print("- Columna 'match_day_id' asegurada en tabla 'matches'.")
        except Exception as e:
            print(f"- Error al agregar match_day_id: {e}")

        # 2. Asegurar que la tabla match_events tenga la columna minute
        try:
            conn.execute(text("ALTER TABLE match_events ADD COLUMN IF NOT EXISTS minute INTEGER DEFAULT 0"))
            conn.commit()
            print("- Columna 'minute' asegurada en tabla 'match_events'.")
        except Exception as e:
            print(f"- Error al agregar minute: {e}")

        # 3. Asegurar que la tabla clubs tenga league_series
        try:
            conn.execute(text("ALTER TABLE clubs ADD COLUMN IF NOT EXISTS league_series VARCHAR DEFAULT 'HONOR'"))
            conn.commit()
            print("- Columna 'league_series' asegurada en tabla 'clubs'.")
        except Exception as e:
            print(f"- Error al agregar league_series: {e}")

    print("Reparación completada.")

if __name__ == "__main__":
    repair_database()
