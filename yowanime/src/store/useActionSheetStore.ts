import { create } from 'zustand';
import type { Anime } from '@/types/anime';

interface ActionSheetState {
  isOpen: boolean;
  selectedAnime: Anime | null;
  openMenu: (anime: Anime) => void;
  closeMenu: () => void;
}

export const useActionSheetStore = create<ActionSheetState>((set) => ({
  isOpen: false,
  selectedAnime: null,
  openMenu: (anime) => set({ isOpen: true, selectedAnime: anime }),
  closeMenu: () => set({ isOpen: false, selectedAnime: null }),
}));
