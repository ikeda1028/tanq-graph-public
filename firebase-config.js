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

// Optional public API endpoints. Never put OPENAI_API_KEY here.
// When this repository is deployed to a host that supports /api functions
// such as Vercel, the app can use same-origin HTTPS endpoints automatically.
const tanqSameOriginAiBase = (() => {
  if (!/^https?:$/.test(location.protocol)) return "";
  if (location.hostname.endsWith("github.io")) return "";
  return location.origin;
})();

window.TANQ_ENCORE_AI_ENDPOINT =
  localStorage.getItem("tanq-encore-ai-endpoint") ||
  (tanqSameOriginAiBase ? `${tanqSameOriginAiBase}/api/encore-coach` : "");

window.TANQ_KIDS_AI_ENDPOINT =
  localStorage.getItem("tanq-kids-ai-endpoint") ||
  (tanqSameOriginAiBase ? `${tanqSameOriginAiBase}/api/kids-coach` : "");

window.TANQ_INQUIRY_DIAGNOSIS_ENDPOINT =
  localStorage.getItem("tanq-inquiry-diagnosis-endpoint") ||
  (tanqSameOriginAiBase
    ? `${tanqSameOriginAiBase}/api/inquiry-diagnosis`
    : "https://tanq-graph-public.vercel.app/api/inquiry-diagnosis");
