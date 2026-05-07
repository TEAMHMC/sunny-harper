// Sunny Harper persona stub.
// All resource data and intent logic moved server-side to hmc-volunteer-portal-v4/src/index.ts.
// SunnyChat.tsx sends messages to the portal API; no client-side intelligence here.

export function getDefaultResponse(lang: 'en' | 'es'): string {
  return lang === 'es'
    ? 'Hola, soy Sunny. Cuéntame qué necesitas y te ayudo a encontrar recursos en tu comunidad.'
    : "Hey, I'm Sunny. Tell me what you need and I'll help you find resources in your community.";
}
