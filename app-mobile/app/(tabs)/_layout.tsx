import { Tabs } from 'expo-router';
import React from 'react';
import { PodcastProvider } from '../PodcastContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  return (
    <PodcastProvider>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="house" color={color} />,
          }}
        />
      <Tabs.Screen
          name="upload"
          options={{
            title: 'Televerser un fichier',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="cloud" color={color} />,
          }}
        />

        <Tabs.Screen
            name="podcasts"
            options={{
              title: 'Mes Podcasts',
              tabBarIcon: ({ color }) => <MaterialIcons name="library-music" size={24} color={color} />,
            }}
          />
      </Tabs>
    </PodcastProvider>
  );
}
