import Foundation
import Capacitor
import FirebaseCore
import FirebaseMessaging

/// Keeps Firebase-specific token handling behind the native application boundary.
/// Capacitor continues to own notification permission, receipt, and action events.
public final class FirebaseMessagingBridge: NSObject, MessagingDelegate {
    public static let shared = FirebaseMessagingBridge()

    private var isConfigured = false
    private var hasAPNsToken = false

    private override init() {
        super.init()
    }

    public func configure() {
        guard !isConfigured else { return }

        guard
            let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
            let options = FirebaseOptions(contentsOfFile: path)
        else {
            NSLog("[PushRegistration] stage=firebase-configuration status=missing-config")
            return
        }

        if FirebaseApp.app() == nil {
            FirebaseApp.configure(options: options)
        }

        Messaging.messaging().delegate = self
        isConfigured = true
        NSLog("[PushRegistration] stage=firebase-configuration status=ready platform=IOS")
    }

    public func registerAPNsToken(_ deviceToken: Data) {
        guard isConfigured else {
            NSLog("[PushRegistration] stage=apns-registration status=firebase-unavailable platform=IOS")
            postRegistrationError("Firebase Messaging is not configured")
            return
        }

        Messaging.messaging().apnsToken = deviceToken
        hasAPNsToken = true
        NSLog("[PushRegistration] stage=apns-registration status=associated platform=IOS")

        Messaging.messaging().token { [weak self] token, error in
            if let error {
                NSLog("[PushRegistration] stage=fcm-token status=error platform=IOS error=%@", error.localizedDescription)
                self?.postRegistrationError("Unable to obtain an FCM registration token")
                return
            }

            guard let token, !token.isEmpty else {
                NSLog("[PushRegistration] stage=fcm-token status=empty platform=IOS")
                self?.postRegistrationError("Firebase returned an empty registration token")
                return
            }

            self?.postFCMToken(token)
        }
    }

    public func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard hasAPNsToken, let fcmToken, !fcmToken.isEmpty else { return }
        postFCMToken(fcmToken)
    }

    private func postFCMToken(_ token: String) {
        NSLog("[PushRegistration] stage=fcm-token status=ready platform=IOS")
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: token
        )
    }

    private func postRegistrationError(_ message: String) {
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: NSError(
                domain: "com.mgrtech.veya.push",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: message]
            )
        )
    }
}
