export interface Market {
  name: string;
  pairs: {
    name: string;
    pair: string;
  }[];
}

export interface DefaultModelResponse {
  id: string;
  value: string;
}
