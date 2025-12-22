
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  role: MessageRole;
  text: string;
}

export interface TranscodingResult {
  originalCode: string;
  camozziCode: string;
  series: string;
  isoStandard: string;
  diameter: string;
  stroke: string;
  similarityCondition: string;
}
