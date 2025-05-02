import { StyleSheet, Platform, Image } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/podcast.jpg')} 
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bienvenue sur Podcast PDF !</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Votre Assistant de Conversion PDF en Podcast</ThemedText>
        <ThemedText>
          Cette application innovante vous permet de transformer vos documents PDF en podcasts audio que vous pouvez écouter où que vous soyez.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Comment ça Marche ?</ThemedText>
        <ThemedText>
          1. Uploadez un PDF : Utilisez l'onglet "Televerser un fichier" pour sélectionner un fichier PDF depuis votre appareil.
        </ThemedText>
        <ThemedText>
          2. Traitement Automatique : Notre système va extraire le texte du PDF, générer un dialogue cohérent et créer un fichier audio au format MP3.
        </ThemedText>
        <ThemedText>
          3. Écoutez Votre Podcast : Une fois le traitement terminé, votre podcast sera disponible sur l'onglet "Mes Podcasts". Vous pourrez l'écouter et le gérer à partir de là.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Commencez Maintenant !</ThemedText>
        <ThemedText>
          Rendez-vous sur l'onglet "Televerser un fichier" pour commencer à convertir vos documents !
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: 300, 
    resizeMode: 'cover', 
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
});