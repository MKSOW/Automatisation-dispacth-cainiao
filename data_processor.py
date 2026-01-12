import pandas as pd
import io
from shapely.geometry import shape, Point

def load_data(uploaded_file):
    """Charge le fichier Cainiao avec détection robuste des colonnes et lignes."""
    try:
        file_name = uploaded_file.name
        raw_content = uploaded_file.getvalue()
        
        if file_name.lower().endswith('.xlsx'):
            df = pd.read_excel(uploaded_file, dtype=str)
        else:
            text = raw_content.decode('utf-8', errors='ignore')
            # skip_blank_lines=True gère les lignes vides au début
            df = pd.read_csv(io.StringIO(text), sep=None, engine='python', dtype=str, skip_blank_lines=True)

        # Nettoyage : Si la première colonne est vide ou bizarre, on cherche la ligne d'entête
        if "Tracking No." not in df.columns:
            # On réessaye en cherchant la ligne qui contient "Tracking No."
            df = pd.read_csv(io.StringIO(text), sep=None, engine='python', dtype=str, skiprows=1)

        # Nettoyage des noms de colonnes (espaces invisibles)
        df.columns = [c.strip() for c in df.columns]

        def split_gps(val):
            try:
                if pd.isna(val) or ',' not in str(val): return None, None
                parts = str(val).replace('"', '').split(',')
                return float(parts[0].strip()), float(parts[1].strip())
            except: return None, None

        gps_col = "Receiver to (Latitude,Longitude)"
        if gps_col in df.columns:
            coords = df[gps_col].apply(lambda x: pd.Series(split_gps(x)))
            df['lat'] = coords[0]
            df['lon'] = coords[1]
            return df, None
        else:
            return None, f"Colonne GPS '{gps_col}' introuvable."
            
    except Exception as e:
        return None, f"Erreur de lecture : {e}"

def filtrer_colis_par_zone(df, last_draw):
    """Filtre les points dans la zone dessinée (Lasso)."""
    if not last_draw or 'geometry' not in last_draw or df.empty:
        return pd.DataFrame()
    
    polygon = shape(last_draw['geometry'])
    # On travaille sur une copie sans les valeurs GPS manquantes
    df_clean = df.dropna(subset=['lat', 'lon']).copy()
    
    def est_dedans(row):
        point = Point(float(row['lon']), float(row['lat']))
        return polygon.contains(point)
    
    mask = df_clean.apply(est_dedans, axis=1)
    return df_clean[mask]

def preparer_telechargement_excel(df_selection):
    """Génère le fichier Excel pour le téléchargement."""
    output = io.BytesIO()
    # On retire les colonnes lat/lon créées pour le moteur
    df_export = df_selection.drop(columns=['lat', 'lon'], errors='ignore')
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df_export.to_excel(writer, index=False)
    return output.getvalue()