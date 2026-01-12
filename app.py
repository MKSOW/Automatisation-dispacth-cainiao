import streamlit as st
import pandas as pd
import folium
from folium.plugins import Draw
from streamlit_folium import st_folium
from data_processor import load_data, filtrer_colis_par_zone, preparer_telechargement_excel

st.set_page_config(layout="wide", page_title="Cainiao Expert Dispatch")

st.title("🗺️ Dispatcher Visuel - Cainiao Expert")

# 1. CHARGEMENT DU FICHIER
uploaded_file = st.file_uploader("Étape 1 : Charger le fichier Cainiao", type=['csv', 'xlsx'])

if uploaded_file:
    df, error = load_data(uploaded_file)
    if error:
        st.error(error)
    else:
        # --- BARRE DE FILTRAGE PAR CODES POSTAUX ---
        st.subheader("🔍 Filtre rapide par Codes Postaux")
        codes_input = st.text_input("Saisissez les codes postaux (ex: 51100, 08400)", 
                                    placeholder="Laissez vide pour tout voir")
        
        df_filtered = df.copy()
        if codes_input:
            list_codes = [c.strip() for c in codes_input.split(',') if c.strip()]
            df_filtered = df[df['Sort Code'].astype(str).str.contains('|'.join(list_codes), na=False)]

        # On prépare les données pour la carte
        df_map = df_filtered.dropna(subset=['lat', 'lon']).copy()
        
        col_map, col_ctrl = st.columns([3, 1])

        with col_map:
            if not df_map.empty:
                # Légende
                st.markdown("""
                <div style="display: flex; gap: 15px; margin-bottom: 5px; font-weight: bold;">
                    <span style="color: red;">🔴 08 (Ardennes)</span> | 
                    <span style="color: blue;">🔵 51 (Marne)</span> | 
                    <span style="color: green;">🟢 02 (Aisne)</span> | 
                    <span style="color: gray;">⚪ Autres</span>
                </div>
                """, unsafe_allow_html=True)
                
                # Centrage de la carte
                center_lat = pd.to_numeric(df_map['lat']).mean()
                center_lon = pd.to_numeric(df_map['lon']).mean()
                
                m = folium.Map(location=[center_lat, center_lon], zoom_start=10)
                
                Draw(export=False, draw_options={
                    'polyline': False, 'circle': False, 'marker': False, 
                    'circlemarker': False, 'polygon': True, 'rectangle': True
                }).add_to(m)

                for i, row in df_map.iterrows():
                    cp = str(row['Sort Code'])
                    # Logique couleur CP
                    dot_color = "red" if cp.startswith(('08', '8')) else \
                                "blue" if cp.startswith('51') else \
                                "green" if cp.startswith(('02', '2')) else "gray"

                    folium.CircleMarker(
                        location=[float(row['lat']), float(row['lon'])],
                        radius=4, color=dot_color, fill=True,
                        popup=f"Ville: {row['Receiver\'s City']}<br>CP: {cp}<br>ID: {row['Tracking No.']}"
                    ).add_to(m)

                output = st_folium(m, width="100%", height=600, key="map_cainiao")
            else:
                st.warning("Aucun point GPS valide trouvé.")

        with col_ctrl:
            st.subheader("📦 Attribution")
            
            # Récupération du dessin
            last_draw = None
            if output and output.get('all_drawings'):
                last_draw = output['all_drawings'][-1]
            
            if last_draw:
                df_selectionne = filtrer_colis_par_zone(df_map, last_draw)
                st.metric("Colis dans la zone", len(df_selectionne))
                
                if not df_selectionne.empty:
                    nom_chauffeur = st.text_input("Nom du Chauffeur :", value="Tournee_1")
                    
                    excel_data = preparer_telechargement_excel(df_selectionne)
                    
                    st.download_button(
                        label=f"📥 Télécharger pour {nom_chauffeur}",
                        data=excel_data,
                        file_name=f"Dispatch_{nom_chauffeur}.xlsx",
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    )
                    st.success("Zone sélectionnée prête !")
            else:
                st.info("💡 Utilisez l'outil polygone (à gauche sur la carte) pour entourer les colis à attribuer.")