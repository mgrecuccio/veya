import Capacitor
import UIKit

@objc(NotificationSettingsPlugin)
public class NotificationSettingsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NotificationSettingsPlugin"
    public let jsName = "NotificationSettings"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

    @objc func open(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let settingsUrlString: String

            if #available(iOS 16.0, *) {
                settingsUrlString = UIApplication.openNotificationSettingsURLString
            } else {
                settingsUrlString = UIApplication.openSettingsURLString
            }

            guard let settingsUrl = URL(string: settingsUrlString) else {
                call.reject("Notification settings are unavailable.")
                return
            }

            UIApplication.shared.open(settingsUrl, options: [:]) { completed in
                call.resolve(["completed": completed])
            }
        }
    }
}
