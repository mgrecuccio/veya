import Capacitor

final class VeyaBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(SingleContactPickerPlugin())
    }
}
