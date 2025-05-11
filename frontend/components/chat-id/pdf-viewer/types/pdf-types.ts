export interface SourceHighlight {
  page: number;
  text: string;
  color?: string;
}

export interface SpanElement {
  element: HTMLSpanElement | null;
  originalText: string;
  originalRect: {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
  };
}

export interface Highlight {
  page: number;
  rect: DOMRect;
  color?: string;
  spanElements: SpanElement[];
} 