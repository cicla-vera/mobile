export const VERA_SECURITY_AUDIO_TASK_NAME = 'vera.security.audio';

export const SECURITY_AUDIO_SEGMENT_MS = 2 * 60 * 1000;
export const SECURITY_AUDIO_POST_TRIGGER_MS = 60 * 1000;

export const SECURITY_AUDIO_TRIGGER_MIN_MS = 4 * 60 * 1000;
export const SECURITY_AUDIO_TRIGGER_MAX_MS = 10 * 60 * 1000;

export const SECURITY_AUDIO_EVIDENCE_DIR = 'vera-security-evidence/';
export const SECURITY_AUDIO_TEMP_DIR = 'vera-security-audio-temp/';
export const SECURITY_AUDIO_MANIFEST_FILE = 'manifest.json';
export const SECURITY_AUDIO_CHECKPOINT_FILE = 'checkpoint.json';

export const SECURITY_AUDIO_MIME_TYPE = 'audio/mp4';

export const LOCAL_SECURITY_EVIDENCE_ID_PREFIX = 'local-security-audio:';
export const LOCAL_SECURITY_EVIDENCE_SESSION_ID = 'local-security-mode';

export const SIMULATED_VIOLENCE_TRIGGERS = [
  'Detectado: ameaca verbal de agressao fisica iminente.',
  'Detectado: insulto, humilhacao e tom intimidatorio repetidos.',
  'Detectado: coacao verbal e controle abusivo no dialogo.',
  'Detectado: linguagem violenta compativel com escalada de agressao.',
] as const;
