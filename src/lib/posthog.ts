import posthog from 'posthog-js';

const POSTHOG_KEY = 'phc_32cT65kyCyT221obBbQTJORVsoqyNgz0GahMWOTWyHL';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.warn('PostHog: No API key found (VITE_POSTHOG_KEY). Analytics disabled.');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
  });
}

export { posthog };
