import { defineComponents } from '@methane-ui/core';
import { MthAudioPlayer } from './audio-player.js';

export { MthAudioPlayer } from './audio-player.js';
export { audioPlayerMessages, type AudioPlayerMessages } from './audio-player.messages.js';
export { audioPlayerStyles } from './audio-player.styles.js';

export function registerMthAudioPlayer(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-audio-player': MthAudioPlayer },
  });
}
