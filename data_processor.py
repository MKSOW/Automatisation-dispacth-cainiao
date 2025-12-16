import pandas as pd
import os
import datetime
import io # Ajout de io pour manipuler le contenu du fichier en mémoire
import re # Ajout de re (regex) bien que non strictement nécessaire ici, il peut l'être pour d'autres validations
import csv

# ==============================================================================
# CONFIGURATION DES COLONNES
# ==============================================================================

# Colonnes essentielles que vous souhaitez conserver (les noms doivent être EXACTS)
COLUMNS_TO_KEEP = [
    'Tracking No.',
    'Sort Code',
    "Receiver's Region/Province",
    "Receiver's City",
    "Receiver's Detail Address"
]

# ==============================================================================
# LOGIQUE DE LECTURE (ROBUSTE)
# ==============================================================================

def load_data(uploaded_file):
    """
    Charge le fichier CSV/Excel en mémoire en essayant plusieurs configurations
    pour garantir la lecture de toutes les lignes.
    """
    
    file_name = uploaded_file.name
    
    if not file_name.lower().endswith(('.csv', '.xlsx')):
        return None, "Format de fichier non supporté. Utilisez .csv ou .xlsx."

    df = None
    
    # 1. Lecture directe si c'est un fichier Excel (.xlsx)
    if file_name.lower().endswith('.xlsx'):
        try:
            # Lire toutes les feuilles et concaténer (certaines prévisions sont sur plusieurs onglets)
            # -> nettoyage par feuille pour éviter multiplication des lignes (headers répétés, lignes vides, etc.)
            sheets = pd.read_excel(uploaded_file, sheet_name=None, dtype=str, engine='openpyxl')
            if isinstance(sheets, dict):
                cleaned = []
                for name, s in sheets.items():
                    # Normaliser en-têtes
                    s.columns = s.columns.astype(str).str.strip()
                    # Convertir cellules vides/blanches en NA puis supprimer lignes totalement vides
                    s = s.replace(r'^\s*$', pd.NA, regex=True)
                    s = s.dropna(how='all')
                    # Supprimer lignes qui sont des répétitions d'en-tête (ex: "Tracking No." mis dans une ligne)
                    if 'Tracking No.' in s.columns:
                        s = s[~s['Tracking No.'].astype(str).str.strip().eq('Tracking No.')]
                    # Debug: nombre de lignes par feuille
                    print(f"[DEBUG] Feuille '{name}' -> {len(s)} lignes")
                    if not s.empty:
                        cleaned.append(s)
                df = pd.concat(cleaned, ignore_index=True) if cleaned else pd.DataFrame()
            else:
                df = sheets
        except Exception as e:
            return None, f"Erreur de lecture du fichier Excel : {e}"
            
    # 2. Lecture robuste si c'est un fichier CSV (.csv)
    elif file_name.lower().endswith('.csv'):

        # Lire le contenu brut du fichier en bytes (solution la plus fiable avec Streamlit)
        raw_content = uploaded_file.getvalue()

        # Essayer plusieurs encodages courants
        encodings_to_try = ['utf-8', 'cp1252', 'latin-1']
        text = None
        encoding_used = None
        for enc in encodings_to_try:
            try:
                text = raw_content.decode(enc)
                encoding_used = enc
                break
            except Exception:
                text = None

        if text is None:
            # Dernier recours : laisser pandas gérer les bytes directement
            try:
                df = pd.read_csv(io.BytesIO(raw_content), engine='python', low_memory=False, dtype=str)
            except Exception as e:
                return None, f"Impossible de décoder le fichier CSV: {e}"
        else:
            # Tenter de détecter le séparateur avec csv.Sniffer sur un échantillon
            sample = text[:10000]
            try:
                dialect = csv.Sniffer().sniff(sample, delimiters=[',', ';', '\t', '|'])
                sep = dialect.delimiter
            except Exception:
                sep = ','

            # Lecture principale: conserver les lignes mal formées pour diagnostic (warn)
            try:
                data_buffer = io.StringIO(text)
                df = pd.read_csv(
                    data_buffer,
                    sep=sep,
                    dtype=str,
                    engine='python',
                    skip_blank_lines=True,
                    low_memory=False,
                    on_bad_lines='warn'
                )
            except Exception:
                # Essayer une lecture plus permissive (pandas détection automatique)
                try:
                    data_buffer = io.StringIO(text)
                    df = pd.read_csv(
                        data_buffer,
                        sep=None,
                        engine='python',
                        dtype=str,
                        low_memory=False,
                        on_bad_lines='warn'
                    )
                except Exception as e:
                    return None, f"Erreur de lecture CSV : {e}"
             
    
    # Vérifier que df a bien été chargé
    if df is None:
        return None, "Aucune donnée lue depuis le fichier."

    # Nettoyage global supplémentaire pour Excel/CSV : supprimer lignes sans Tracking No., dédoublonner
    try:
        # remplacer chaînes vides par NA puis drop
        df = df.replace(r'^\s*$', pd.NA, regex=True)
        if 'Tracking No.' in df.columns:
            before = len(df)
            df = df.dropna(subset=['Tracking No.'])
            # retirer éventuelles lignes d'entête restantes
            df = df[~df['Tracking No.'].astype(str).str.strip().eq('Tracking No.')]
            # dédoublonner par numéro de suivi
            df = df.drop_duplicates(subset=['Tracking No.'], keep='first').reset_index(drop=True)
            after = len(df)
            print(f"[DEBUG] Nettoyage global -> avant: {before} ; après dédup/dropna: {after}")
    except Exception:
        pass
    
    # --- Étape 3 : Validation et Filtrage des Colonnes ---
    
    # Nettoyer les en-têtes (supprimer les espaces blancs autour)
    df.columns = df.columns.str.strip()
    
    # Vérifier que les colonnes essentielles sont présentes
    missing_cols = [col for col in COLUMNS_TO_KEEP if col not in df.columns]
    if missing_cols:
        return None, f"Colonnes manquantes : {missing_cols}. Veuillez vérifier l'orthographe des en-têtes du fichier."

    # Filtrer et nettoyer les données
    df_filtered = df[COLUMNS_TO_KEEP].copy()
    
    # Supprimer les lignes sans 'Sort Code' avant conversion, puis nettoyer la colonne
    df_filtered = df_filtered.dropna(subset=['Sort Code'], how='any')
    df_filtered['Sort Code'] = df_filtered['Sort Code'].astype(str).str.strip()
    # Supprimer les lignes où le code est vide après strip
    df_filtered = df_filtered[df_filtered['Sort Code'] != '']
    
    return df_filtered, None

# ==============================================================================
# LOGIQUE D'EXPORTATION
# ==============================================================================

def export_colis_par_livreur(df, livreurs_sectors, base_output_dir):
    """Filtre les colis par livreur et exporte les fichiers dans un dossier daté."""
    date_jour = datetime.datetime.now().strftime("%Y-%m-%d")
    output_folder = os.path.join(base_output_dir, f"PREVISIONS_TRIEES_DU_{date_jour}")
    os.makedirs(output_folder, exist_ok=True)
    
    results = []
    
    # Obtenir tous les codes postaux attribués
    all_assigned_codes = [code for codes in livreurs_sectors.values() for code in codes]

    # Boucle d'exportation pour chaque livreur
    for nom_livreur, codes_postaux in livreurs_sectors.items():
        # Filtrage
        df_livreur = df[df['Sort Code'].isin(codes_postaux)]
        
        if not df_livreur.empty:
            nom_fichier_sortie = f"Colis_{nom_livreur}_{date_jour}.xlsx"
            output_path = os.path.join(output_folder, nom_fichier_sortie)
            
            # Exportation au format Excel
            df_livreur.to_excel(output_path, index=False)
            results.append(f"✅ Exporté **{len(df_livreur)}** colis pour **{nom_livreur}** dans `{nom_fichier_sortie}`")
    
    # Gérer les colis non attribués
    tous_codes_dans_fichier = set(df['Sort Code'].unique())
    codes_non_traites = tous_codes_dans_fichier - set(all_assigned_codes)
    
    df_non_traites_reels = df[df['Sort Code'].isin(codes_non_traites)]
    
    if not df_non_traites_reels.empty:
        nom_fichier_non_traites = f"Colis_NON_ATTRIBUES_{date_jour}.xlsx"
        output_path_non_traites = os.path.join(output_folder, nom_fichier_non_traites)
        df_non_traites_reels.to_excel(output_path_non_traites, index=False)
        results.append(f"⚠️ **{len(df_non_traites_reels)}** colis pour codes postaux **non attribués** ont été exportés dans `{nom_fichier_non_traites}`")
    
    return results, output_folder