import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Podcast {
  filename: string;
}

interface PodcastContextType {
  podcasts: Podcast[];
  addPodcast: (filename: string) => void;
}

const PodcastContext = createContext<PodcastContextType | undefined>(undefined);

interface PodcastProviderProps {
  children: ReactNode;
}

export const PodcastProvider: React.FC<PodcastProviderProps> = ({ children }) => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect to load podcasts from AsyncStorage when the component mounts
  useEffect(() => {
    const loadPodcasts = async () => {
      try {
        const storedPodcasts = await AsyncStorage.getItem('podcasts');
        if (storedPodcasts !== null) {
          setPodcasts(JSON.parse(storedPodcasts));
        }
      } catch (error) {
        console.error('Error loading podcasts from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPodcasts();
  }, []);

  // useEffect to save podcasts to AsyncStorage whenever the 'podcasts' state changes
  useEffect(() => {
    const savePodcasts = async () => {
      if (!loading) {
        try {
          await AsyncStorage.setItem('podcasts', JSON.stringify(podcasts));
        } catch (error) {
          console.error('Error saving podcasts to AsyncStorage:', error);
        }
      }
    };

    savePodcasts();
  }, [podcasts, loading]);

  // Function to add a new podcast to the list
  const addPodcast = (filename: string) => {
    const newPodcast: Podcast = {
        filename    };
    setPodcasts((prevPodcasts) => [...prevPodcasts, newPodcast]);
  };

  // The value that will be provided by the context
  const contextValue: PodcastContextType = {
    podcasts,
    addPodcast,
  };

  return (
    <PodcastContext.Provider value={contextValue}>
      {children}
    </PodcastContext.Provider>
  );
};

// Custom hook to use the context easily in components
export const usePodcastContext = () => {
  const context = React.useContext(PodcastContext);
  if (context === undefined) {
    throw new Error('usePodcastContext must be used within a PodcastProvider');
  }
  return context;
};

export default PodcastContext;