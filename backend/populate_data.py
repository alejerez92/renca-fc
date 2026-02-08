from database import SessionLocal
from models import Club, Team, Category, Match, Venue, MatchDay, Player
import random
from datetime import datetime, timedelta

# Nombres y Apellidos comunes en Chile para generar jugadores realistas
first_names = ["Juan", "Pedro", "Diego", "José", "Luis", "Carlos", "Jorge", "Manuel", "Víctor", "Cristian", 
               "Francisco", "Rodrigo", "Miguel", "Patricio", "Eduardo", "Roberto", "Alejandro", "Claudio", 
               "Matías", "Pablo", "Esteban", "Alexis", "Arturo", "Gary", "Mauricio", "Humberto", "Felipe"]
last_names = ["González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Martínez", 
              "Sepúlveda", "Morales", "Rodríguez", "López", "Fuentes", "Hernández", "Torres", "Araya", 
              "Flores", "Espinoza", "Valenzuela", "Castillo", "Tapia", "Reyes", "Gutiérrez", "Castro", 
              "Pizarro", "Álvarez", "Vásquez", "Sánchez", "Fernández", "Carrasco", "Gómez", "Cortés"]

def generate_rut():
    return f"{random.randint(10, 25)}.{random.randint(100, 999)}.{random.randint(100, 999)}-{random.choice(['0','1','2','3','4','5','6','7','8','9','K'])}"

def populate():
    db = SessionLocal()
    
    # ... (código existente de estadios y fechas) ...
    venues_data = [
        {"name": "Estadio Municipal de Renca", "address": "Domingo Santa María 3987"},
        {"name": "Nuevo Estadio Renca", "address": "Av. Vicuña Mackenna 1500"}
    ]
    venues = []
    for v in venues_data:
        venue = Venue(name=v["name"], address=v["address"])
        db.add(venue)
        venues.append(venue)
    db.commit()
    print("Estadios creados.")

    # 1.5 Crear Fechas (Match Days)
    # Definimos 4 fechas que cubran el rango de tiempo de los partidos aleatorios
    base_date = datetime.now() - timedelta(days=20)
    for i in range(1, 5):
        start = base_date + timedelta(days=(i-1)*7)
        end = start + timedelta(days=6)
        md = MatchDay(name=f"Fecha {i}", start_date=start, end_date=end)
        db.add(md)
    db.commit()
    print("Fechas creadas.")
    
    # 2. Obtener Categorías
    categories = db.query(Category).all()
    cat_map = {c.name: c.id for c in categories}
    
    # 2. Definir 20 Clubes (10 Honor, 10 Ascenso)
    honor_clubs = [
        "Renca United", "Halcones FC", "Estrella del Norte", "C.D. La Isla", 
        "Rayos de Renca", "Sportivo Victoria", "Real Renca", "Atlético Miramar", 
        "Unión Esperanza", "Fuerza Joven"
    ]
    ascenso_clubs = [
        "Deportivo Central", "Ferroviario Renca", "Los Pumas", "Barrio Alto FC",
        "Juveniles del Sur", "C.D. El Roble", "Independiente Renca", "Sol de América",
        "Titanes FC", "Dragones del Norte"
    ]
    
    clubs = []
    for name in honor_clubs:
        club = Club(name=name, logo_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={name}", league_series="HONOR")
        db.add(club)
        clubs.append(club)
    
    for name in ascenso_clubs:
        club = Club(name=name, logo_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={name}", league_series="ASCENSO")
        db.add(club)
        clubs.append(club)
    
    db.commit()
    
    # 3. Crear Equipos
    test_cats = ["Primera Adulto", "Segunda Adulto", "Tercera Adulto", "Senior", "Super Senior"]
    
    teams = []
    for club in clubs:
        # Cada club tiene equipos en varias categorías
        for cat_name in test_cats:
            team = Team(club_id=club.id, category_id=cat_map[cat_name])
            db.add(team)
            teams.append(team)
    db.commit()

    # 4. Generar Partidos y Resultados (Simulando 3 fechas por categoría)
    # ... (Lógica de partidos existente) ...
            
    db.commit()
    
    # 5. Crear Jugadores para todos los equipos
    print("Generando plantillas de jugadores...")
    all_teams = db.query(Team).all()
    players_batch = []
    
    for team in all_teams:
        # Crear entre 15 y 22 jugadores por equipo
        num_players = random.randint(15, 22)
        used_numbers = set()
        
        for _ in range(num_players):
            # Generar nombre único
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            # Asignar dorsal único
            number = random.randint(1, 99)
            while number in used_numbers:
                number = random.randint(1, 99)
            used_numbers.add(number)
            
            player = Player(
                team_id=team.id,
                name=name,
                number=number,
                dni=generate_rut()
            )
            players_batch.append(player)
            
    db.add_all(players_batch)
    db.commit()
    
    db.close()
    print("Base de datos poblada con Clubes, Equipos, Fixture y JUGADORES.")

if __name__ == "__main__":
    populate()
