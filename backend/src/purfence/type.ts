export type ModelConfig = {
  default: {
    id: string;
    model: string;
  };
  fallbacks: {
    id: string;
    model: string;
  }[];
};
