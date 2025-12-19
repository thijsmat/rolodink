import { getRequestConfig } from 'next-intl/server';

// Static imports for messages (required for Turbopack compatibility)
import nlMessages from './messages/nl.json';
import enMessages from './messages/en.json';

const messages = {
    nl: nlMessages,
    en: enMessages,
} as const;

type Locale = keyof typeof messages;

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !Object.keys(messages).includes(locale)) {
        locale = 'nl';
    }

    return {
        locale,
        messages: messages[locale as Locale]
    };
});
