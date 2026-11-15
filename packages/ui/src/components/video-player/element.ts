import { defineComponents } from '@methane/core';
import { MthVideoPlayer } from './video-player.js';

export { MthVideoPlayer } from './video-player.js';
export { videoPlayerMessages, type VideoPlayerMessages } from './video-player.messages.js';
export { videoPlayerSpec } from './video-player.spec.js';
export { videoPlayerStyles } from './video-player.styles.js';

export function registerMthVideoPlayer(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-video-player': MthVideoPlayer },
  });
}
