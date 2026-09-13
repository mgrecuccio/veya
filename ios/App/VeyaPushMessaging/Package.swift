// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "VeyaPushMessaging",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "VeyaPushMessaging", targets: ["VeyaPushMessaging"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.2"),
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", exact: "12.14.0")
    ],
    targets: [
        .target(
            name: "VeyaPushMessaging",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "FirebaseCore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseMessaging", package: "firebase-ios-sdk")
            ]
        )
    ]
)
