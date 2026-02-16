import sqlite3
import os
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Player, Club, Category, Venue, Team

# Nombres de estadios por defecto (Solo campos que existen en el modelo)
DEFAULT_VENUES = [
    {"name": "Estadio Municipal de Renca", "address": "Domingo Santa María 3929"},
    {"name": "Cancha La Catalana", "address": "Calle La Catalana s/n"}
]

def migrate():
    print("--- Iniciando Migración a la Nube ---")
    
    # 1. Conexión a la Nube (Postgres)
    db_cloud = SessionLocal()
    
    # --- PARTE 1: CREAR ESTADIOS ---
    print("\n1. Verificando Estadios...")
    for v_data in DEFAULT_VENUES:
        exists = db_cloud.query(Venue).filter(Venue.name == v_data["name"]).first()
        if not exists:
            venue = Venue(**v_data)
            db_cloud.add(venue)
            print(f"   [+] Estadio creado: {venue.name}")
        else:
            print(f"   [v] Estadio ya existe: {v_data['name']}")
    db_cloud.commit()

    # --- PARTE 2: MIGRAR JUGADORES ---
    if not os.path.exists("renca_fc.db"):
        print("\n[ERROR] No encuentro el archivo local 'renca_fc.db'.")
        return

    print("\n2. Leyendo base de datos local (renca_fc.db)...")
    conn_local = sqlite3.connect("renca_fc.db")
    cursor = conn_local.cursor()
    
    # Obtener jugadores locales con match de Club y Categoría
    try:
        cursor.execute("""
            SELECT p.dni, p.name, p.birth_date, c.name as club_name, cat.name as cat_name
            FROM players p
            JOIN teams t ON p.team_id = t.id
            JOIN clubs c ON t.club_id = c.id
            JOIN categories cat ON t.category_id = cat.id
        """)
        local_players = cursor.fetchall()
    except sqlite3.OperationalError:
        # Por si la estructura local es diferente (p.ej. sin tabla teams intermedia en local)
        cursor.execute("""
            SELECT p.dni, p.name, p.birth_date, c.name as club_name, cat.name as cat_name
            FROM players p
            JOIN clubs c ON p.club_id = c.id
            JOIN categories cat ON p.category_id = cat.id
        """)
        local_players = cursor.fetchall()

    print(f"   -> Se encontraron {len(local_players)} jugadores en local.")

    # Cachear IDs de la nube (Teams es la clave aquí)
    # Necesitamos el ID del TEAM (Club + Categoría) en la nube
    teams_cloud = {}
    for t in db_cloud.query(Team).join(Club).join(Category).all():
        key = (t.club.name, t.category.name)
        teams_cloud[key] = t.id
    
    # Cachear DNI (RUT) existentes en la nube
    existing_dnis = {p.dni for p in db_cloud.query(Player.dni).all() if p.dni}

    count_migrated = 0
    count_skipped = 0
    count_error = 0

    print("\n3. Subiendo jugadores a Supabase...")
    for row in local_players:
        dni, name, birth_date, club_name, cat_name = row
        
        if dni and dni in existing_dnis:
            count_skipped += 1
            continue

        # Buscar el Team ID correspondiente en la nube
        team_id = teams_cloud.get((club_name, cat_name))

        if team_id:
            # Convertir fecha si es necesario
            from datetime import datetime
            b_date = None
            if birth_date:
                try:
                    b_date = datetime.fromisoformat(birth_date)
                except:
                    b_date = None

            new_player = Player(
                dni=dni,
                name=name,
                birth_date=b_date,
                team_id=team_id
            )
            db_cloud.add(new_player)
            count_migrated += 1
        else:
            count_error += 1
            
        if count_migrated % 50 == 0:
            db_cloud.commit()

    db_cloud.commit()
    conn_local.close()
    db_cloud.close()
    
    print("\n--- Resumen ---")
    print(f"Migrados: {count_migrated}")
    print(f"Omitidos (Ya existían): {count_skipped}")
    print(f"Errores (Team no encontrado): {count_error}")
    print("--------------------------------")

if __name__ == "__main__":
    migrate()
