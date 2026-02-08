from database import SessionLocal, init_db
from models import Category

def seed_categories():
    db = SessionLocal()
    categories = [
        # Infantiles
        {"name": "Primera Infantil", "parent_category": None, "points_win": 3, "points_draw": 1},
        {"name": "Segunda Infantil", "parent_category": None, "points_win": 3, "points_draw": 1},
        {"name": "Tercera Infantil", "parent_category": None, "points_win": 3, "points_draw": 1},
        {"name": "Juvenil", "parent_category": None, "points_win": 3, "points_draw": 1},
        
        # Adultos (Suman entre ellas)
        {"name": "Primera Adulto", "parent_category": "Adultos", "points_win": 6, "points_draw": 3},
        {"name": "Segunda Adulto", "parent_category": "Adultos", "points_win": 4, "points_draw": 2},
        {"name": "Tercera Adulto", "parent_category": "Adultos", "points_win": 2, "points_draw": 1},
        
        # Otros
        {"name": "Senior", "parent_category": None, "points_win": 3, "points_draw": 1},
        {"name": "Super Senior", "parent_category": None, "points_win": 3, "points_draw": 1},
        {"name": "Dorados", "parent_category": None, "points_win": 3, "points_draw": 1},
    ]
    
    for cat_data in categories:
        exists = db.query(Category).filter(Category.name == cat_data["name"]).first()
        if not exists:
            category = Category(**cat_data)
            db.add(category)
    
    db.commit()
    db.close()
    print("Categorías inicializadas correctamente.")

if __name__ == "__main__":
    init_db()
    seed_categories()
