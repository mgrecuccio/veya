package com.mgrtech.veya;

import android.content.Intent;
import android.app.NotificationManager;
import android.net.Uri;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationSettings")
public class NotificationSettingsPlugin extends Plugin {
    @PluginMethod
    public void areEnabled(PluginCall call) {
        NotificationManager manager = (NotificationManager) getContext()
            .getSystemService(NotificationManager.class);
        JSObject result = new JSObject();
        result.put("enabled", manager != null && manager.areNotificationsEnabled());
        call.resolve(result);
    }

    @PluginMethod
    public void open(PluginCall call) {
        String packageName = getContext().getPackageName();
        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, packageName);

        if (intent.resolveActivity(getContext().getPackageManager()) == null) {
            intent = new Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:" + packageName)
            );
        }

        try {
            getActivity().startActivity(intent);
            JSObject result = new JSObject();
            result.put("completed", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Notification settings are unavailable.", error);
        }
    }
}
