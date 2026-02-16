from sqlalchemy.orm import Session
from database import SessionLocal
from models import Club, Team, Category

def fix_ascenso_teams():
    db = SessionLocal()
    print("--- Limpiando equipos de Ascenso en categorías no correspondientes ---")

    # 1. Identificar Clubes de Ascenso
    ascenso_clubs = db.query(Club).filter(Club.league_series == 'ASCENSO').all()
    ascenso_club_ids = [c.id for c in ascenso_clubs]
    print(f"Clubes de Ascenso encontrados: {len(ascenso_clubs)}")

    # 2. Identificar Categorías que NO son de Adultos
    # Asumimos que las categorías de adultos tienen parent_category='Adultos' 
    # OJO: Revisar cómo se guardaron en seed.py.
    # En seed.py: "Primera Adulto" -> parent="Adultos".
    # Las demás (Infantiles, Senior) -> parent=None.
    
    # Queremos mantenerlos SOLO en las que parent_category == 'Adultos'
    # Por lo tanto, borramos de las que parent_category != 'Adultos' (o es None)
    
    teams_to_delete = db.query(Team).join(Category).filter(
        Team.club_id.in_(ascenso_club_ids),
        (Category.parent_category != 'Adultos') | (Category.parent_category == None)
    ).all()

    count = len(teams_to_delete)
    print(f"Se encontraron {count} equipos de Ascenso en series Infantiles/Senior.")

    if count > 0:
        print("Borrando...")
        for team in teams_to_delete:
            db.delete(team)
        db.commit()
        print("¡Limpieza completada! Los clubes de Ascenso ahora solo existen en Adultos.")
    else:
        print("Todo parece estar en orden (o no se encontraron equipos para borrar).")

    db.close()

if __name__ == "__main__":
    fix_ascenso_teams()
