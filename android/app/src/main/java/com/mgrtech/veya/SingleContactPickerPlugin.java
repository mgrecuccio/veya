package com.mgrtech.veya;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SingleContactPicker")
public class SingleContactPickerPlugin extends Plugin {
    @PluginMethod
    public void pickContact(PluginCall call) {
        Intent intent = new Intent(
            Intent.ACTION_PICK,
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI
        );

        if (intent.resolveActivity(getContext().getPackageManager()) == null) {
            call.reject("The contact picker is unavailable.");
            return;
        }

        startActivityForResult(call, intent, "handleContactResult");
    }

    @ActivityCallback
    private void handleContactResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK) {
            JSObject cancelled = new JSObject();
            cancelled.put("cancelled", true);
            call.resolve(cancelled);
            return;
        }

        Intent data = result.getData();
        Uri contactUri = data == null ? null : data.getData();

        if (contactUri == null) {
            call.reject("No contact was selected.");
            return;
        }

        String[] projection = new String[] {
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE,
            ContactsContract.CommonDataKinds.Phone.LABEL
        };

        try (Cursor cursor = getContext().getContentResolver().query(
            contactUri,
            projection,
            null,
            null,
            null
        )) {
            if (cursor == null || !cursor.moveToFirst()) {
                call.reject("The selected contact could not be read.");
                return;
            }

            String displayName = cursor.getString(0);
            String phoneNumber = cursor.getString(1);
            int phoneType = cursor.getInt(2);
            String customLabel = cursor.getString(3);
            CharSequence phoneLabel = ContactsContract.CommonDataKinds.Phone.getTypeLabel(
                getContext().getResources(),
                phoneType,
                customLabel
            );

            JSObject phone = new JSObject();
            phone.put("label", phoneLabel == null ? "" : phoneLabel.toString());
            phone.put("value", phoneNumber == null ? "" : phoneNumber);

            JSArray phoneNumbers = new JSArray();
            phoneNumbers.put(phone);

            JSObject selected = new JSObject();
            selected.put("cancelled", false);
            selected.put("displayName", displayName == null ? "" : displayName);
            selected.put("phoneNumbers", phoneNumbers);
            call.resolve(selected);
        } catch (SecurityException error) {
            call.reject("The selected contact could not be read.", error);
        }
    }
}
