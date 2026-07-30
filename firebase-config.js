// To share one Firestore database across every device/browser, paste the
// Firebase Web App config here. Firebase apiKey is an identifier, not a
// secret, but Firestore Security Rules and Authentication must protect data.
//
// Example:
// window.TANQ_FIREBASE_CONFIG = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "..."
// };

window.TANQ_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDkBwH2Ev65USrwjWZo0EbBibSs9_PX4XU",
  authDomain: "tanqgraph.firebaseapp.com",
  projectId: "tanqgraph",
  storageBucket: "tanqgraph.firebasestorage.app",
  messagingSenderId: "924757219137",
  appId: "1:924757219137:web:eb1f8b17f4833948b4f3c0",
  measurementId: "G-6VPZCL2J50"
};

// Optional public API endpoint for Proofolio Encore.
// Set this after deploying encore-ai-server.mjs to Cloud Run, Firebase
// Functions, Vercel, or another HTTPS backend. Never put OPENAI_API_KEY here.
window.TANQ_ENCORE_AI_ENDPOINT = localStorage.getItem("tanq-encore-ai-endpoint") || "";
