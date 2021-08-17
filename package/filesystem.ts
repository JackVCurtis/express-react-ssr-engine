import { createFsFromVolume, Volume } from "memfs"

export const mockFs = createFsFromVolume(new Volume())