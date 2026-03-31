export type DataObject<T> = {
  id: string;
  type: string;
  body: T;
};

export type Text = {
  language: "en" | "es" | "fr" | "ar" | "ny";
  text: string;
};

export type TranslationText = Text

export type PartialTranslation = Pick<DataObject<Text>, 'body'>;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationDetail = {
  name?: string;
  description?: string;
  coordinates?: Coordinates;
};

export type LoanStatus = {
  id: number
  label: string
  abbrev: string
}