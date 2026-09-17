import { Injectable, inject, signal } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  AndroidBiometryStrength,
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
} from '@aparajita/capacitor-biometric-auth';
import {
  KeychainAccess,
  SecureStorage,
} from '@aparajita/capacitor-secure-storage';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';

const BIOMETRIC_ENABLED_KEY = 'auth.biometricLoginEnabled';
const BIOMETRIC_REFRESH_TOKEN_KEY = 'biometricRefreshToken';
const APP_LOCK_TIMEOUT_MS = 30_000;

export interface BiometricLoginAvailability {
  available: boolean;
  enabled: boolean;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class BiometricLoginService {
  private readonly authService = inject(AuthService);
  private storageConfigured = false;
  private appStateListener?: Promise<PluginListenerHandle>;
  private backgroundedAt: number | null = null;
  private authenticating = false;

  readonly isLocked = signal(false);
  readonly isUnlocking = signal(false);
  readonly unlockError = signal<string | null>(null);
  readonly activeBiometricLabel = signal('biometrics');

  constructor() {
    this.authService.authTokensUpdated$.subscribe(tokens => {
      void this.saveRefreshToken(tokens.refreshToken).catch(error => {
        console.warn('[BiometricLoginService] Failed to update stored credential', error);
      });
    });
  }

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    this.registerAppStateListener();

    if (!this.isEnabled()) {
      return;
    }

    // Never let persisted bearer tokens bypass the biometric gate.
    this.isLocked.set(true);
    this.authService.lock();

    const availability = await this.getAvailability();
    if (!availability.available) {
      this.isLocked.set(false);
      return;
    }

    try {
      await this.login();
    } catch (error) {
      if (!this.isCancellation(error)) {
        console.warn('[BiometricLoginService] Automatic login failed', error);
      }
    } finally {
      // A cancelled cold-start prompt falls back to the regular login page.
      this.isLocked.set(false);
    }
  }

  async getAvailability(): Promise<BiometricLoginAvailability> {
    if (!Capacitor.isNativePlatform()) {
      return {
        available: false,
        enabled: false,
        label: 'Biometrics',
      };
    }

    try {
      const result = await BiometricAuth.checkBiometry();
      const label = this.getBiometryLabel(result.biometryType);
      this.activeBiometricLabel.set(label);
      return {
        available: result.isAvailable,
        enabled: this.isEnabled(),
        label,
      };
    } catch {
      return {
        available: false,
        enabled: this.isEnabled(),
        label: 'Biometrics',
      };
    }
  }

  async enable(refreshToken: string): Promise<void> {
    if (!refreshToken.trim()) {
      throw new Error('No refresh token is available for biometric login.');
    }

    const availability = await this.getAvailability();
    if (!availability.available) {
      throw new Error('Biometric authentication is not available on this device.');
    }

    await this.authenticate(`Protect Veya with ${availability.label}`);
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    try {
      await this.saveRefreshToken(refreshToken);
    } catch (error) {
      localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      throw error;
    }
  }

  async disable(): Promise<void> {
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    this.isLocked.set(false);
    this.unlockError.set(null);

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await this.configureStorage();
      await SecureStorage.remove(BIOMETRIC_REFRESH_TOKEN_KEY, false);
    } catch (error) {
      console.warn('[BiometricLoginService] Failed to remove stored credential', error);
    }
  }

  async login(): Promise<void> {
    const availability = await this.getAvailability();
    if (!availability.available || !this.isEnabled()) {
      throw new Error('Biometric login is not available.');
    }

    await this.authenticate(`Unlock Veya with ${availability.label}`);
    await this.configureStorage();
    const refreshToken = await SecureStorage.get(
      BIOMETRIC_REFRESH_TOKEN_KEY,
      false,
      false,
    );

    if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
      await this.disable();
      throw new Error('Biometric login is no longer configured. Log in with your phone number.');
    }

    try {
      const tokens = await firstValueFrom(
        this.authService.refreshWithToken(refreshToken)
      );
      await this.saveRefreshToken(tokens.refreshToken);
    } catch (error) {
      await this.disable();
      throw error;
    }
  }

  async saveRefreshToken(refreshToken: string): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.isEnabled()) {
      return;
    }

    await this.configureStorage();
    await SecureStorage.set(
      BIOMETRIC_REFRESH_TOKEN_KEY,
      refreshToken,
      false,
      false,
      KeychainAccess.whenPasscodeSetThisDeviceOnly,
    );
  }

  async unlockApp(): Promise<void> {
    if (!this.isLocked() || this.authenticating) {
      return;
    }

    if (!this.authService.getAccessToken()) {
      this.isLocked.set(false);
      return;
    }

    const availability = await this.getAvailability();
    if (!availability.available || !this.isEnabled()) {
      this.unlockError.set(
        'Biometric protection is unavailable. Use your phone number and password.'
      );
      throw new Error('Biometric protection is unavailable.');
    }

    this.isUnlocking.set(true);
    this.unlockError.set(null);

    try {
      await this.authenticate(`Unlock Veya with ${availability.label}`);
      this.isLocked.set(false);
      this.backgroundedAt = null;
    } catch (error) {
      this.unlockError.set('Veya is still locked. Try again or use your password.');
      throw error;
    } finally {
      this.isUnlocking.set(false);
    }
  }

  private isEnabled(): boolean {
    return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
  }

  private registerAppStateListener(): void {
    if (this.appStateListener) {
      return;
    }

    this.appStateListener = App.addListener(
      'appStateChange',
      ({ isActive }) => void this.handleAppStateChange(isActive),
    );
  }

  private async handleAppStateChange(isActive: boolean): Promise<void> {
    if (this.authenticating || !this.isEnabled()) {
      return;
    }

    if (!isActive) {
      if (!this.authService.getAccessToken()) {
        return;
      }

      this.backgroundedAt = Date.now();
      // Hide account content immediately, including in the app switcher.
      this.isLocked.set(true);
      this.unlockError.set(null);
      return;
    }

    if (!this.isLocked() || this.backgroundedAt === null) {
      return;
    }

    if (Date.now() - this.backgroundedAt < APP_LOCK_TIMEOUT_MS) {
      this.isLocked.set(false);
      this.backgroundedAt = null;
      return;
    }

    try {
      await this.unlockApp();
    } catch {
      // Keep the privacy overlay visible. It provides retry and password actions.
    }
  }

  private async configureStorage(): Promise<void> {
    if (this.storageConfigured) {
      return;
    }

    await SecureStorage.setKeyPrefix('veya_');
    await SecureStorage.setSynchronize(false);
    await SecureStorage.setDefaultKeychainAccess(
      KeychainAccess.whenPasscodeSetThisDeviceOnly,
    );
    this.storageConfigured = true;
  }

  private async authenticate(reason: string): Promise<void> {
    this.authenticating = true;

    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Use password',
        allowDeviceCredential: false,
        iosFallbackTitle: 'Use password',
        androidTitle: 'Unlock Veya',
        androidSubtitle: reason,
        androidConfirmationRequired: false,
        androidBiometryStrength: AndroidBiometryStrength.weak,
      });
    } finally {
      this.authenticating = false;
    }
  }

  private getBiometryLabel(type: BiometryType): string {
    switch (type) {
      case BiometryType.faceId:
        return 'Face ID';
      case BiometryType.touchId:
        return 'Touch ID';
      case BiometryType.faceAuthentication:
        return 'face recognition';
      case BiometryType.fingerprintAuthentication:
        return 'fingerprint';
      case BiometryType.irisAuthentication:
        return 'iris recognition';
      default:
        return 'biometrics';
    }
  }

  private isCancellation(error: unknown): boolean {
    return error instanceof BiometryError && (
      error.code === BiometryErrorType.userCancel ||
      error.code === BiometryErrorType.userFallback ||
      error.code === BiometryErrorType.systemCancel ||
      error.code === BiometryErrorType.appCancel
    );
  }
}
