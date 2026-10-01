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
    profileLookupUrl,
    isLinkedInProfileUrl,
    legacyNormalizeLinkedInUrl,
    getProfileSlug,
    isOpaqueProfileId,
    deriveNameFromSlug,
    extractLinkedInProfileUrl,
    buildLookupCandidates,
    isSameProfile,
} from './url.js';

export { PROFILE_URL_VECTORS } from './url-vectors.js';
export type { ProfileUrlVector } from './url-vectors.js';

export { cleanProfileName } from './name.js';

export { normalizeApiBaseUrl, resolveApiBaseUrl } from './api.js';

export { CONNECTION_CONFLICT_CODE, readConflict, versionOf, withExpectedVersion } from './conflict.js';
export type { VersionedRow } from './conflict.js';

export {
    RolodinkClient,
    RolodinkApiError,
    UnauthorizedError,
    DuplicateConnectionError,
    ConnectionConflictError,
    RateLimitedError,
} from './client.js';
export type { RolodinkClientOptions } from './client.js';

export type { Connection, ConnectionInput, ConnectionPatch } from './types.js';
