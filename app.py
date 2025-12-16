import streamlit as st
import pandas as pd
import os
# Importe les fonctions de votre fichier de logique
from data_processor import load_data, export_colis_par_livreur 

# --- CONFIGURATION INITIALE & ÉTAT DE LA SESSION ---

# Initialiser l'état de la session (pour que la configuration persiste)
if 'df_colis' not in st.session_state:
    st.session_state.df_colis = pd.DataFrame()

# Configuration initiale du mapping livreurs/secteurs (À PERSONNALISER)
if 'livreurs_sectors_config' not in st.session_state:
    st.session_state.livreurs_sectors_config = {
        "Livreur_Michel": ['51100', '51200', '51350'], # EXEMPLE: Modifiez ces codes
        "Livreur_Julie": ['08000', '08100', '08400'],   # EXEMPLE: Modifiez ces codes
        # Ajoutez ici les autres chauffeurs/codes avant la première exécution
    }


def display_main_app():
    """Affiche l'interface principale de l'application."""
    
    st.set_page_config(layout="wide")
    st.title("📦 Automatisation de la Répartition des Colis")
    st.markdown("---")

    # 1. CHARGEMENT DU FICHIER SOURCE
    
    st.header("1. Charger le Fichier de Prévisions du Jour")
    
    uploaded_file = st.file_uploader("Sélectionnez le fichier **CSV** ou **XLSX** du jour :", 
                                     type=['csv', 'xlsx'])
    
    if uploaded_file is not None:
        with st.spinner(f"Analyse du fichier **{uploaded_file.name}** en cours..."):
            df_colis, error = load_data(uploaded_file)
        
        if error:
            st.error(f"❌ Erreur de chargement : {error}")
            st.session_state.df_colis = pd.DataFrame()
        else:
            st.session_state.df_colis = df_colis
            st.success(f"Fichier chargé avec succès ! **{len(df_colis)}** colis prêts à être triés.")
            
    # Afficher les données si elles sont chargées
    if not st.session_state.df_colis.empty:
        df = st.session_state.df_colis
        st.subheader(f"Aperçu des Données à Trier ({len(df)} colis)")
        st.dataframe(df.head(), use_container_width=True)
        
        st.markdown("---")

        # ==============================================================================
        # 2. CONFIGURATION DES SECTEURS
        # ==============================================================================
        
        st.header("2. Configuration des Secteurs et des Livreur")
        
        # Interface pour ajouter/modifier un livreur
        with st.expander("Gérer la liste des Livreur et des Codes Postaux"):
            col1, col2 = st.columns(2)
            
            # 2.1 Sélection / Création du Livreur
            with col1:
                livreurs_list = list(st.session_state.livreurs_sectors_config.keys())
                livreurs_list.insert(0, "--- Nouveau Livreur ---")
                
                selected_driver = st.selectbox("Sélectionnez un Livreur à modifier ou créer :", 
                                               livreurs_list)
                
                initial_name = selected_driver if selected_driver != "--- Nouveau Livreur ---" else ""
                initial_codes = ", ".join(st.session_state.livreurs_sectors_config.get(selected_driver, []))
                
                driver_name_input = st.text_input("Nom du Livreur :", value=initial_name)
                
            # 2.2 Saisie des Codes Postaux
            with col2:
                codes_input = st.text_area("Codes postaux (séparés par des virgules, ex: 51100, 51350)", 
                                           value=initial_codes, height=100)
            
            col_btn1, col_btn2, col_btn3 = st.columns(3)

            with col_btn1:
                if st.button("💾 Ajouter/Mettre à jour le Livreur", use_container_width=True):
                    if driver_name_input and codes_input:
                        codes_list = [code.strip() for code in codes_input.split(',') if code.strip()]
                        st.session_state.livreurs_sectors_config[driver_name_input] = codes_list
                        st.success(f"Livreur **{driver_name_input}** mis à jour avec {len(codes_list)} codes postaux.")
                    else:
                        st.warning("Veuillez remplir le nom et les codes postaux.")

            with col_btn2:
                 if st.button("🗑️ Supprimer le Livreur Sélectionné", use_container_width=True):
                    if selected_driver in st.session_state.livreurs_sectors_config:
                        del st.session_state.livreurs_sectors_config[selected_driver]
                        st.success(f"Livreur **{selected_driver}** supprimé.")
                        st.experimental_rerun()
                    else:
                         st.warning("Aucun livreur sélectionné à supprimer.")

            # Afficher la configuration actuelle
            st.subheader("Mapping actuel des Livreur/Secteurs")
            df_mapping = pd.DataFrame(st.session_state.livreurs_sectors_config.items(), columns=["Livreur", "Codes Postaux"])
            df_mapping['Nb Codes'] = df_mapping['Codes Postaux'].apply(len)
            st.dataframe(df_mapping.style.background_gradient(cmap='Blues'), hide_index=True, use_container_width=True)
            
        st.markdown("---")

        # 3. EXÉCUTION ET EXPORTATION
        
        st.header("3. Exécuter le Tri et l'Exportation")
        
        default_output_dir = os.path.join(os.path.expanduser('~'), 'Desktop', 'CAINIAO_SORTIES')
        output_dir = st.text_input("Chemin du Dossier de Sortie", 
                                   value=default_output_dir)

        if st.button("🚀 Lancer l'Automatisation et Créer les Fichiers !"):
            if not st.session_state.livreurs_sectors_config:
                 st.error("Veuillez configurer au moins un livreur et ses codes postaux.")
            else:
                with st.spinner("Traitement et exportation en cours..."):
                    results, output_folder = export_colis_par_livreur(
                        st.session_state.df_colis, 
                        st.session_state.livreurs_sectors_config, 
                        output_dir
                    )
                
                st.success("🎉 Tâche terminée ! Détails de l'exportation :")
                st.markdown(f"**Dossier de sortie créé :** `{output_folder}`")
                
                for result in results:
                    st.markdown(f"- {result}")
            
# --- LANCEMENT DE L'APPLICATION ---
if __name__ == "__main__":
    display_main_app()