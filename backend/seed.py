from database import SessionLocal, engine
from models import Base, Category, Club, Team

def seed_data():
    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Iniciando carga de datos iniciales...")

    # 1. CATEGORÍAS (Con reglas de edad)
    categories_data = [
        # Infantiles
        {"name": "Primera Infantil", "parent_category": None},
        {"name": "Segunda Infantil", "parent_category": None},
        {"name": "Tercera Infantil", "parent_category": None},
        {"name": "Juvenil", "parent_category": None},
        
        # Adultos (Suman entre ellas)
        {"name": "Primera Adulto", "parent_category": "Adultos", "points_win": 6, "points_draw": 3},
        {"name": "Segunda Adulto", "parent_category": "Adultos", "points_win": 4, "points_draw": 2},
        {"name": "Tercera Adulto", "parent_category": "Adultos", "points_win": 2, "points_draw": 1},
        
        # Seniors (Con restricción de edad)
        {"name": "Senior", "parent_category": None, "min_age": 35, "exception_min_age": 33, "max_exceptions": 3},
        {"name": "Super Senior", "parent_category": None, "min_age": 45, "exception_min_age": 43, "max_exceptions": 3},
        {"name": "Dorados", "parent_category": None, "min_age": 50, "exception_min_age": 48, "max_exceptions": 3},
    ]
    
    categories_map = {}
    
    for cat_data in categories_data:
        cat = db.query(Category).filter(Category.name == cat_data["name"]).first()
        if not cat:
            cat = Category(**cat_data)
            db.add(cat)
            db.commit()
            db.refresh(cat)
            print(f"Categoría creada: {cat.name}")
        categories_map[cat.name] = cat.id

    # 2. CLUBES BASE
    clubs_data = [
        {"name": "Defensor Renca", "league_series": "HONOR"},
        {"name": "Estrella de Chile", "league_series": "HONOR"},
        {"name": "Jorge Guzmán", "league_series": "HONOR"},
        {"name": "Juventud Colo Colo", "league_series": "HONOR"},
        {"name": "José Manuel Balmaceda", "league_series": "HONOR"},
        {"name": "La Catalana", "league_series": "HONOR"},
        {"name": "Nacional V.A.R.", "league_series": "HONOR"},
        {"name": "Real Estación", "league_series": "HONOR"},
        {"name": "Unión Renca", "league_series": "HONOR"},
        {"name": "Unión Santa Emilia", "league_series": "HONOR"},
        
        {"name": "Atlético Madrid", "league_series": "ASCENSO"},
        {"name": "Atlético Miramar", "league_series": "ASCENSO"},
        {"name": "Deportivo Mackenna", "league_series": "ASCENSO"},
        {"name": "Ferroviario Renca", "league_series": "ASCENSO"},
        {"name": "Halcones FC", "league_series": "ASCENSO"},
        {"name": "Lautaro", "league_series": "ASCENSO"},
        {"name": "Los Pumas", "league_series": "ASCENSO"},
        {"name": "Rayos de Renca", "league_series": "ASCENSO"},
        {"name": "Renca United", "league_series": "ASCENSO"},
        {"name": "Santa Rosa", "league_series": "ASCENSO"},
    ]

    for club_data in clubs_data:
        club = db.query(Club).filter(Club.name == club_data["name"]).first()
        if not club:
            club = Club(name=club_data["name"], league_series=club_data["league_series"], logo_url="https://via.placeholder.com/150")
            db.add(club)
            db.commit()
            db.refresh(club)
            print(f"Club creado: {club.name}")
            
            # 3. INSCRIBIR EQUIPOS AUTOMÁTICAMENTE EN TODAS LAS CATEGORÍAS
            for cat_name, cat_id in categories_map.items():
                existing_team = db.query(Team).filter(Team.club_id == club.id, Team.category_id == cat_id).first()
                if not existing_team:
                    new_team = Team(club_id=club.id, category_id=cat_id)
                    db.add(new_team)
            db.commit()

    db.close()
    print("¡Base de datos poblada con éxito!")

if __name__ == "__main__":
    seed_data()