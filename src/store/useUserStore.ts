import { create } from "zustand";

interface UserState {
  name: string;
  currentRole: string;
  targetRole: string;
  setName: (name: string) => void;
  setCurrentRole: (role: string) => void;
  setTargetRole: (role: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: "",
  currentRole: "",
  targetRole: "",
  setName: (name) => set({ name }),
  setCurrentRole: (currentRole) => set({ currentRole }),
  setTargetRole: (targetRole) => set({ targetRole }),
}));
