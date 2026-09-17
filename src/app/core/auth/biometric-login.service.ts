import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
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

export interface BiometricLoginAvailability {
  available: boolean;
  enabled: boolean;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class BiometricLoginService {
  private readonly authService = inject(AuthService);
  private storageConfigured = false;

  async initialize(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    // Never let persisted bearer tokens bypass the biometric gate.
    this.authService.lock();

    const availability = await this.getAvailability();
    if (!availability.available) {
      return;
    }

    try {
      await this.login();
    } catch (error) {
      if (!this.isCancellation(error)) {
        console.warn('[BiometricLoginService] Automatic login failed', error);
      }
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
      return {
        available: result.isAvailable,
        enabled: this.isEnabled(),
        label: this.getBiometryLabel(result.biometryType),
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

    await this.authenticate(`Enable ${availability.label} login`);
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

    await this.authenticate(`Log in to Veya with ${availability.label}`);
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
    if (!this.isEnabled()) {
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

  private isEnabled(): boolean {
    return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
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

  private authenticate(reason: string): Promise<void> {
    return BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Use phone number',
      allowDeviceCredential: false,
      iosFallbackTitle: 'Use phone number',
      androidTitle: 'Biometric login',
      androidSubtitle: reason,
      androidConfirmationRequired: false,
      androidBiometryStrength: AndroidBiometryStrength.weak,
    });
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
