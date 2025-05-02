import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { usePodcastContext } from '../PodcastContext';

const PodcastListScreen: React.FC = () => {
  const { podcasts } = usePodcastContext();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingFilename, setPlayingFilename] = useState<string | null>(null);

  async function playSound(filename: string) {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setPlayingFilename(null);
    }

    const backendBaseUrl = 'http://172.20.10.3:5000'; 
    const podcastUrl = `${backendBaseUrl}/podcast_generated/${filename}`;
    console.log('Chargement et lecture du son depuis :', podcastUrl);

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: podcastUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingFilename(filename);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setSound(null);
          setPlayingFilename(null);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Erreur lors du chargement ou de la lecture du son :', error);
      Alert.alert('Erreur de Lecture', 'Impossible de lire le podcast.');
      setSound(null);
      setPlayingFilename(null);
    }
  }

  async function stopSound() {
    if (sound) {
      console.log('Arrêt du son');
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingFilename(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Podcasts</Text>
      {podcasts.length === 0 ? (
        <Text>Aucun podcast généré pour le moment.</Text>
      ) : (
        <FlatList
          data={podcasts}
          keyExtractor={(item) => item.filename}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.podcastItem}
              onPress={() => {
                if (playingFilename === item.filename) {
                  stopSound();
                } else {
                  playSound(item.filename);
                }
              }}
            >
              <Text style={styles.podcastFilename}>
                {item.filename} {playingFilename === item.filename ? ' (En lecture)' : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  podcastItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  podcastFilename: {
    fontSize: 16,
  },
});

export default PodcastListScreen;