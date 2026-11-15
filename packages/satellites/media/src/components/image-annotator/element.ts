import { defineComponents } from '@methane-ui/core';
import { MthImageAnnotator } from './image-annotator.js';

export {
  MthImageAnnotator,
  ImageAnnotatorEngine,
  type AnnotationPoint,
  type AnnotationTool,
  type ImageAnnotation,
} from './image-annotator.js';

export function registerMthImageAnnotator(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-image-annotator': MthImageAnnotator,
    },
  });
}

registerMthImageAnnotator();
