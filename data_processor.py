import pandas as pd
import os
import datetime
import io
from shapely.geometry import shape, Point

def load_data(uploaded_file):
    file_name = uploaded_file.name
    raw_content = uploaded_file.getvalue()
    try:
        if file_name.lower().endswith('.xlsx'):
            df = pd.read_excel(uploaded_file, dtype=str)
        else:
            text = raw_content.decode('utf-8', errors='ignore')
            df = pd.read_csv(io.StringIO(text), sep=None, engine='python', dtype=str)
    except Exception as e:
        return None, f"Erreur de lecture : {e}"

    def split_gps(val):
        try:
            if pd.isna(val) or ',' not in str(val): return None, None
            lat, lon = str(val).replace('"', '').split(',')
            return float(lat), float(lon)
        except: return None, None

    if "Receiver to (Latitude,Longitude)" in df.columns:
        df[['lat', 'lon']] = df["Receiver to (Latitude,Longitude)"].apply(lambda x: pd.Series(split_gps(x)))
    
    return df, None

def filtrer_colis_par_zone(df, last_draw):
    if not last_draw or 'geometry' not in last_draw:
        return pd.DataFrame()
    polygon = shape(last_draw['geometry'])
    def est_dedans(row):
        if pd.isna(row['lat']) or pd.isna(row['lon']): return False
        point = Point(row['lon'], row['lat'])
        return polygon.contains(point)
    mask = df.apply(est_dedans, axis=1)
    return df[mask]

def export_selection_carte(df_selection, nom_chauffeur, base_dir):
    date_j = datetime.datetime.now().strftime("%Y-%m-%d")
    folder = os.path.join(base_dir, f"DISPATCH_VISUEL_{date_j}")
    os.makedirs(folder, exist_ok=True)
    nom_propre = "".join(x for x in nom_chauffeur if x.isalnum() or x in "._- ").strip()
    file_path = os.path.join(folder, f"Colis_{nom_propre}.xlsx")
    df_export = df_selection.drop(columns=['lat', 'lon'], errors='ignore')
    df_export.to_excel(file_path, index=False)
    return file_path