interface Window {
  webkitSpeechRecognition: any;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
