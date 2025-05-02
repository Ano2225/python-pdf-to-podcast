import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Button } from 'react-native';
import { Audio } from 'expo-av';
import { usePodcastContext } from '../PodcastContext';

const PodcastListScreen: React.FC = () => {
  const { podcasts } = usePodcastContext();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingFilename, setPlayingFilename] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Function to generate a more presentable title from the filename
  const getPresentableTitle = (filename: string): string => {
    let title = filename.replace(/\.mp3$/, '');
    title = title.replace(/^podcast_/, 'podcast_generated');
    title = title.replace(/_/g, ' ');
    if (title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    return title;
  };

  async function playSound(filename: string) {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    }

    // *** IMPORTANT: Replace with the CORRECT local IP address of your computer and the Flask port ***
    const backendBaseUrl = 'http://172.20.10.3:5000';
    const podcastUrl = `${backendBaseUrl}/podcast_generated/${filename}`;
    console.log('Loading and playing sound from:', podcastUrl);

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: podcastUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              newSound.unloadAsync();
              setSound(null);
              setIsPlaying(false);
              setPosition(0);
              setDuration(0);
              setPlayingFilename(null);
            }
          }
        }
      );
      setSound(newSound);
      setPlayingFilename(filename);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error loading or playing sound:', error);
      Alert.alert('Playback Error', 'Unable to play the podcast.');
      setSound(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setPlayingFilename(null);
    }
  }

  async function pauseSound() {
    if (sound && isPlaying) {
      console.log('Pausing sound');
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }

  async function resumeSound() {
    if (sound && !isPlaying) {
      console.log('Resuming sound');
      await sound.playAsync();
      setIsPlaying(true);
    }
  }

  // Effect to unload sound when the component unmounts
  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading sound on unmount');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Function to format time in mm:ss
  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Podcasts</Text>
      {podcasts.length === 0 ? (
        <Text>Pas de podcast généré</Text>
      ) : (
        <FlatList
          data={podcasts}
          keyExtractor={(item) => item.filename}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.podcastItem,
                playingFilename === item.filename && styles.playingItem,
              ]}
              onPress={() => {
                if (playingFilename === item.filename) {
                  if (isPlaying) {
                    pauseSound();
                  } else {
                    resumeSound();
                  }
                } else {
                  playSound(item.filename);
                }
              }}
            >
              <Text style={styles.podcastTitle}>
                {getPresentableTitle(item.filename)}
              </Text>
              {playingFilename === item.filename && (
                <View style={styles.playbackControls}>
                  <Button
                    title={isPlaying ? 'Pause' : 'Lire'}
                    onPress={() => {
                      if (isPlaying) {
                        pauseSound();
                      } else {
                        resumeSound();
                      }
                    }}
                  />
                  <Text>{formatTime(position)} / {formatTime(duration)}</Text>
                </View>
              )}
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
    backgroundColor: '#000',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  podcastItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  playingItem: {
    backgroundColor: '#e0f7fa',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  podcastTitle: {
    fontSize: 18,
    color: '#555',
    fontWeight: '500',
    marginBottom: 5,
  },
  podcastDate: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    width: '100%',
  },
});

export default PodcastListScreen;