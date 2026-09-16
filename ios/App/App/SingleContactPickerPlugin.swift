import Capacitor
import Contacts
import ContactsUI

@objc(SingleContactPickerPlugin)
public class SingleContactPickerPlugin: CAPPlugin, CAPBridgedPlugin, CNContactPickerDelegate {
    public let identifier = "SingleContactPickerPlugin"
    public let jsName = "SingleContactPicker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pickContact", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?

    @objc func pickContact(_ call: CAPPluginCall) {
        guard pendingCall == nil else {
            call.reject("The contact picker is already open.")
            return
        }

        guard let viewController = bridge?.viewController else {
            call.reject("The contact picker is unavailable.")
            return
        }

        pendingCall = call

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            let picker = CNContactPickerViewController()
            picker.delegate = self
            picker.displayedPropertyKeys = [CNContactPhoneNumbersKey]
            viewController.present(picker, animated: true)
        }
    }

    public func contactPickerDidCancel(_ picker: CNContactPickerViewController) {
        resolvePendingCall(with: ["cancelled": true])
    }

    public func contactPicker(
        _ picker: CNContactPickerViewController,
        didSelect contact: CNContact
    ) {
        let phoneNumbers: JSArray = contact.phoneNumbers.map { phoneNumber in
            let label = phoneNumber.label.map {
                CNLabeledValue<NSString>.localizedString(forLabel: $0)
            } ?? ""

            return [
                "label": label,
                "value": phoneNumber.value.stringValue
            ] as JSObject
        }

        resolvePendingCall(with: [
            "cancelled": false,
            "displayName": CNContactFormatter.string(from: contact, style: .fullName) ?? "",
            "phoneNumbers": phoneNumbers
        ])
    }

    private func resolvePendingCall(with result: JSObject) {
        pendingCall?.resolve(result)
        pendingCall = nil
    }
}
