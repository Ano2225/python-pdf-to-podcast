import React, { FC, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { usePodcastContext } from '../PodcastContext';
import { MaterialIcons } from '@expo/vector-icons';

const UploadScreen: FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [podcastFilename, setPodcastFilename] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const { addPodcast } = usePodcastContext();

  async function playSound(filename: string) {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    // *** IMPORTANT: Replace with the CORRECT local IP address of your computer and the Flask port ***
    const backendBaseUrl = 'http://172.20.10.3:5000';
    const podcastUrl = `${backendBaseUrl}/podcast_generated/${filename}`;
    console.log('Loading sound from:', podcastUrl);
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

      console.log('Playing sound');
      await newSound.playAsync();
    } catch (error) {
      console.error('Error loading or playing sound:', error);
      Alert.alert('Playback Error', 'Unable to play the podcast.');
    }
  }

  async function stopSound() {
    if (sound) {
      console.log('Stopping sound');
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  }

  const handleUploadPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });

      if (result.canceled === false) {
        const fileUri = result.assets ? result.assets[0].uri : null;
        const fileName = result.assets ? result.assets[0].name : 'file.pdf';

        if (fileUri) {
          setLoading(true);
          setPodcastFilename(null);
          setSelectedFileName(fileName);

          const formData = new FormData();
          formData.append('pdf_file', {
            uri: fileUri,
            name: fileName,
            type: 'application/pdf',
          } as any);

          // *** IMPORTANT: Replace with the CORRECT local IP address of your computer and the Flask port ***
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
            setSelectedFileName(null);

            if (response.ok) {
              const responseData = await response.json();
              console.log('Upload successful! Backend response:', responseData);
              Alert.alert('Success', 'The PDF file has been processed and the podcast generated!');

              const generatedFilename = responseData.podcast_filename;
              if (generatedFilename) {
                setPodcastFilename(generatedFilename);
                addPodcast(generatedFilename);
              } else {
                Alert.alert('Error', 'The podcast filename was not received from the backend.');
              }

            } else {
              const errorData = await response.text();
              console.error('Upload failed. Status:', response.status, 'Response:', errorData);
              Alert.alert('Error', `File upload failed. Status: ${response.status}\nResponse: ${errorData}`);
            }
          } catch (uploadError) {
            setLoading(false);
            setSelectedFileName(null);
            console.error('Error uploading file:', uploadError);
            Alert.alert('Error', 'An error occurred while uploading the file.');
          }
        } else {
          Alert.alert('Error', 'Unable to get the URI of the selected file.');
        }
      } else {
        console.log('File selection cancelled.');
        setSelectedFileName(null);
      }
    } catch (err) {
      console.error('Error during document selection:', err);
      Alert.alert('Error', 'An error occurred during file selection.');
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Convertir un PDF en podcast</Text>
      <Text style={styles.subtitle}>Selectionner un fichier PDF pour generer votre podcast.</Text>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUploadPDF}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={styles.buttonContent}>
            <MaterialIcons name="file-upload" size={24} color="#fff" />
            <Text style={styles.buttonText}>
              {selectedFileName ? `Selectionné: ${selectedFileName}` : 'Selectionner un PDF'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Traitement en cours...</Text>
        </View>
      )}

      {podcastFilename && (
        <View style={styles.podcastContainer}>
          <Text style={styles.podcastGeneratedText}>Podcast Generé !</Text>
          <TouchableOpacity style={styles.playButton} onPress={() => playSound(podcastFilename)}>
            <MaterialIcons name="play-circle-outline" size={30} color="#fff" />
            <Text style={styles.playButtonText}>Lire</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginTop: 50,
    textAlign:'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffff',
    marginBottom: 30,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 0,
    marginLeft: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  podcastContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  podcastGeneratedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 15,
  },
  playButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default UploadScreen;