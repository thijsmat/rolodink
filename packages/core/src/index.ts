export {
    ENCRYPTION_PREFIX,
    isEncryptedString,
    importDataKey,
    encryptText,
    decryptText,
} from './crypto.js';

export {
    SENSITIVE_FIELDS,
    encryptSensitiveFields,
    decryptSensitiveFields,
    decryptMany,
    buildSearchHaystack,
} from './fields.js';
export type { FieldCipher, SensitiveField, DecryptOptions } from './fields.js';

export {
    normalizeLinkedInUrl,
    legacyNormalizeLinkedInUrl,
    getProfileSlug,
    isOpaqueProfileId,
    deriveNameFromSlug,
    extractLinkedInProfileUrl,
    buildLookupCandidates,
    isSameProfile,
} from './url.js';

export { cleanProfileName } from './name.js';

export {
    RolodinkClient,
    RolodinkApiError,
    UnauthorizedError,
    DuplicateConnectionError,
    RateLimitedError,
} from './client.js';
export type { RolodinkClientOptions } from './client.js';

export type { Connection, ConnectionInput, ConnectionPatch } from './types.js';
