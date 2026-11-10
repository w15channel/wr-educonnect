import { describe, it, expect } from 'vitest';
import {
  extractGoogleDriveId,
  detectMediaProvider,
  resolveAudioStreamUrl,
  normalizeDropboxUrl,
  normalizeOneDriveUrl,
} from './mediaUrlResolver';

describe('mediaUrlResolver', () => {
  it('extracts Google Drive ID from various sharing formats', () => {
    const url1 = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing';
    const url2 = 'https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9I0J';
    const url3 = 'https://docs.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/edit';

    expect(extractGoogleDriveId(url1)).toBe('1A2B3C4D5E6F7G8H9I0J');
    expect(extractGoogleDriveId(url2)).toBe('1A2B3C4D5E6F7G8H9I0J');
    expect(extractGoogleDriveId(url3)).toBe('1A2B3C4D5E6F7G8H9I0J');
  });

  it('detects media providers correctly', () => {
    expect(detectMediaProvider('https://drive.google.com/file/d/abc1234/view').provider).toBe('Google Drive');
    expect(detectMediaProvider('https://1drv.ms/u/s!Alq01').provider).toBe('OneDrive');
    expect(detectMediaProvider('https://youtu.be/dQw4w9WgXcQ').provider).toBe('YouTube');
    expect(detectMediaProvider('https://example.com/audio.mp3').provider).toBe('Direct');
  });

  it('normalizes Dropbox dl=0 to raw=1', () => {
    expect(normalizeDropboxUrl('https://www.dropbox.com/s/12345/audio.mp3?dl=0')).toBe('https://www.dropbox.com/s/12345/audio.mp3?raw=1');
  });

  it('normalizes OneDrive url with download parameter', () => {
    const oneDriveUrl = 'https://onedrive.live.com/?cid=123&id=456&resid=123!456';
    expect(normalizeOneDriveUrl(oneDriveUrl)).toContain('download=1');
  });

  it('resolves audio stream URL to proxy for Google Drive and OneDrive', () => {
    const driveUrl = 'https://drive.google.com/file/d/1A2B3C4D/view?usp=sharing';
    const oneDriveUrl = 'https://onedrive.live.com/view?resid=ABC';
    const directMp3 = 'https://cdn.example.com/podcast.mp3';

    expect(resolveAudioStreamUrl(driveUrl)).toBe('/api/stream-audio?driveId=1A2B3C4D');
    expect(resolveAudioStreamUrl(oneDriveUrl)).toContain('/api/stream-audio?url=');
    expect(resolveAudioStreamUrl(directMp3)).toBe(directMp3);
  });

  it('detects Google NotebookLM correctly', () => {
    const nlmUrl = 'https://notebooklm.google.com/notebook/3b50f53c-1e5c-4aa2-b3f3-21c755c64be2/artifact/1883f310';
    const detection = detectMediaProvider(nlmUrl);
    expect(detection.provider).toBe('NotebookLM');
    expect(detection.isNotebookLm).toBe(true);
  });
});
