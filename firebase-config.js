const firebaseConfig = {
  apiKey: "COLOA_AQUI_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "COLOA_AQUI_SENDER_ID",
  appId: "COLOA_AQUI_APP_ID"
};

const FIREBASE_ENABLED =
  firebaseConfig.apiKey !== "COLOA_AQUI_API_KEY" &&
  firebaseConfig.projectId !== "SEU_PROJETO";
