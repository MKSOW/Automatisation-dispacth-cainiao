import streamlit as st
import pandas as pd
import folium
from folium.plugins import Draw
from streamlit_folium import st_folium
import os
from data_processor import load_data, export_selection_carte, filtrer_colis_par_zone

st.set_page_config(layout="wide", page_title="Logistics Visual Hub")

st.title("🚀 Logistics Hub : Dispatch Visuel Expert")

# 1. CHARGEMENT
uploaded_file = st.file_uploader("Étape 1 : Charger le fichier Cainiao", type=['csv', 'xlsx'])

if uploaded_file:
    df, error = load_data(uploaded_file)
    if error:
        st.error(error)
    else:
        # --- BARRE DE FILTRAGE PAR CODES POSTAUX ---
        st.markdown("---")
        st.subheader("🔍 Filtre de précision")
        codes_input = st.text_input("Saisissez les codes postaux à afficher (séparés par des virgules)", 
                                    placeholder="Ex: 51100, 08400, 02000")
        
        df_filtered = df.copy()
        if codes_input:
            # On nettoie la saisie (enlève les espaces et split par virgule)
            list_codes = [c.strip() for c in codes_input.split(',') if c.strip()]
            df_filtered = df[df['Sort Code'].str.contains('|'.join(list_codes), na=False)]
            st.caption(f"Filtrage actif : {len(df_filtered)} colis correspondent à vos codes.")

        df_map = df_filtered.dropna(subset=['lat', 'lon']).copy()
        
        col_map, col_ctrl = st.columns([3, 1])

        with col_map:
            # Légende
            st.markdown("""
            <div style="display: flex; gap: 15px; font-weight: bold;">
                <span style="color: red;">🔴 08</span> | <span style="color: blue;">🔵 51</span> | 
                <span style="color: green;">🟢 02</span> | <span style="color: gray;">⚪ Autres</span>
            </div>
            """, unsafe_allow_html=True)

            if not df_map.empty:
                center_lat = df_map['lat'].mean()
                center_lon = df_map['lon'].mean()
                m = folium.Map(location=[center_lat, center_lon], zoom_start=10)
                
                Draw(export=False, draw_options={
                    'polyline': False, 'circle': False, 'marker': False, 
                    'circlemarker': False, 'polygon': True, 'rectangle': True
                }).add_to(m)

                for i, row in df_map.iterrows():
                    cp = str(row['Sort Code'])
                    dot_color = "red" if cp.startswith('08') or cp.startswith('8') else \
                                "blue" if cp.startswith('51') else \
                                "green" if cp.startswith('02') or cp.startswith('2') else "gray"

                    folium.CircleMarker(
                        location=[row['lat'], row['lon']],
                        radius=4, color=dot_color, fill=True,
                        popup=f"Ville: {row['Receiver\'s City']}<br>CP: {cp}"
                    ).add_to(m)

                output = st_folium(m, width="100%", height=600, key="map_expert")
            else:
                st.warning("Aucun colis avec coordonnées GPS trouvé pour ces codes postaux.")

        with col_ctrl:
            st.subheader("Attribution")
            last_draw = output['all_drawings'][-1] if output and output.get('all_drawings') else None
            
            if last_draw:
                df_selectionne = filtrer_colis_par_zone(df_map, last_draw)
                st.metric("📦 Dans la zone", len(df_selectionne))
                
                if not df_selectionne.empty:
                    nom_chauffeur = st.text_input("Nom du chauffeur :", placeholder="Ex: MATHIEU_RETHEL")
                    if st.button("📥 Exporter la sélection"):
                        if nom_chauffeur.strip():
                            path = export_selection_carte(df_selectionne, nom_chauffeur, os.path.join(os.path.expanduser('~'), 'Desktop'))
                            st.success(f"Fichier créé sur le Bureau")
                            st.balloons()
                        else:
                            st.error("Entrez un nom !")
            else:
                st.info("💡 Tracez une zone sur la carte pour isoler des colis.")