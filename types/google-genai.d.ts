declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(options?: { apiKey?: string });
    models: {
      generateContent(params: any): Promise<any>;
    };
    live: {
      connect(params: any): Promise<any>;
    };
  }

  export const Type: {
    TYPE_UNSPECIFIED: string;
    STRING: string;
    NUMBER: string;
    INTEGER: string;
    BOOLEAN: string;
    ARRAY: string;
    OBJECT: string;
    NULL: string;
  };

  export const Modality: {
    MODALITY_UNSPECIFIED: string;
    TEXT: string;
    IMAGE: string;
    AUDIO: string;
    VIDEO: string;
  };

  export interface FunctionDeclaration {
    name: string;
    description: string;
    parameters?: any;
    response?: any;
  }

  export interface LiveServerMessage {
    serverContent?: {
      modelTurn?: {
        parts: Array<{
          text?: string;
          inlineData?: {
            mimeType: string;
            data: string;
          };
        }>;
      };
      outputTranscription?: {
        text?: string;
      };
      inputTranscription?: {
        text?: string;
      };
      turnComplete?: boolean;
      interrupted?: boolean;
    };
    toolCall?: {
      functionCalls?: Array<{
        name: string;
        args: Record<string, any>;
        id?: string;
      }>;
    };
    toolCallCancellation?: {
      ids?: string[];
    };
  }

  export interface Blob {
    data: string;
    mimeType: string;
  }
}
