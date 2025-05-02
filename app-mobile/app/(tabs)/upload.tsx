import React, { FC, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, GestureResponderEvent, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { usePodcastContext } from '../PodcastContext'; 

const UploadScreen: FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [podcastFilename, setPodcastFilename] = useState<string | null>(null);

  const { addPodcast } = usePodcastContext();

  async function playSound(filename: string) {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    const backendBaseUrl = 'http://172.20.10.3:5000'; 
    const podcastUrl = `${backendBaseUrl}/podcast_generated/${filename}`;
    console.log('Chargement du son depuis :', podcastUrl);
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: podcastUrl },
        { shouldPlay: true }
      );
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync(); 
          setSound(null);
        }
      });

      console.log('Lecture du son');
      await newSound.playAsync();
    } catch (error) {
      console.error('Erreur lors du chargement ou de la lecture du son :', error);
      Alert.alert('Erreur de Lecture', 'Impossible de lire le podcast.');
    }
  }

  async function stopSound() {
    if (sound) {
      console.log('Arrêt du son');
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  }

  const handleUploadPDF = async (event: GestureResponderEvent) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf', 
        copyToCacheDirectory: false, 
      });

      if (result.canceled === false) {
        const fileUri = result.assets ? result.assets[0].uri : null;

        if (fileUri) {
          setLoading(true);
          setPodcastFilename(null); 

          const formData = new FormData();
          formData.append('pdf_file', {
            uri: fileUri,
            name: result.assets ? result.assets[0].name : 'file.pdf',
            type: 'application/pdf',
          } as any);

          const backendBaseUrl = 'http://172.20.10.3:5000'; 
          const uploadUrl = `${backendBaseUrl}/upload-pdf`;

          try {
            const response = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            setLoading(false);

            if (response.ok) {
              const responseData = await response.json();
              console.log('Envoi réussi ! Réponse du backend :', responseData);
              Alert.alert('Succès', 'Le fichier PDF a été traité et le podcast généré !');

              const generatedFilename = responseData.podcast_filename;
              if (generatedFilename) {
                setPodcastFilename(generatedFilename); 

                addPodcast(generatedFilename);
              } else {
                Alert.alert('Erreur', 'Le nom du fichier podcast n\'a pas été reçu du backend.');
              }

            } else {
              const errorData = await response.text();
              console.error('Échec de l\'envoi. Statut :', response.status, 'Réponse:', errorData);
              Alert.alert('Erreur', `Échec de l'envoi du fichier. Statut: ${response.status}\nRéponse: ${errorData}`);
            }
          } catch (uploadError) {
            setLoading(false);
            console.error('Erreur lors de l\'envoi du fichier :', uploadError);
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du fichier.');
          }
        } else {
          Alert.alert('Erreur', 'Impossible d\'obtenir l\'URI du fichier sélectionné.');
        }
      } else {
        console.log('Sélection de fichier annulée.');
      }
    } catch (err) {
      console.error('Erreur lors de la sélection du document :', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection du fichier.');
    }
  };

  React.useEffect(() => {
    return sound
      ? () => {
          console.log('Déchargement du son');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Traitement du PDF en cours...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Envoyer un PDF</Text>
          <TouchableOpacity style={styles.button} onPress={handleUploadPDF}>
            <Text style={styles.buttonText}>Sélectionner un PDF</Text>
          </TouchableOpacity>

          {podcastFilename && (
            <View style={styles.podcastContainer}>
              <Text style={styles.podcastText}>Podcast Généré:</Text>
              <Text style={styles.podcastFilename}>{podcastFilename}</Text>
              <View style={styles.audioControls}>
                <TouchableOpacity style={styles.audioButton} onPress={() => playSound(podcastFilename)}>
                  <Text style={styles.buttonText}>Lire</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.audioButton} onPress={stopSound}>
                  <Text style={styles.buttonText}>Arrêter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0000ff',
  },
  podcastContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  podcastText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  podcastFilename: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  audioButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    width: '45%',
  },
});

export default UploadScreen;