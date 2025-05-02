import React, { createContext, useState, ReactNode } from 'react';

// Define the type for a podcast (more info can be added later, such as date, etc.)
interface Podcast {
  filename: string;
}

// Define the type for the context
interface PodcastContextType {
  podcasts: Podcast[];
  addPodcast: (filename: string) => void;
}

// Create the context with default values (to be replaced by the Provider)
const PodcastContext = createContext<PodcastContextType | undefined>(undefined);

// Create a Provider component that will wrap components needing access to the context
interface PodcastProviderProps {
  children: ReactNode;
}

export const PodcastProvider: React.FC<PodcastProviderProps> = ({ children }) => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  // Function to add a new podcast to the list
  const addPodcast = (filename: string) => {
    const newPodcast: Podcast = { filename };
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

// Custom hook to easily use the context in components
export const usePodcastContext = () => {
  const context = React.useContext(PodcastContext);
  if (context === undefined) {
    throw new Error('usePodcastContext must be used within a PodcastProvider');
  }
  return context;
};

export default PodcastContext;