//! macOS menubar popover configuration for tray + quick-paste overlays.
//!
//! Tried in Phase 3.1: `alwaysOnTop` + `visibleOnAllWorkspaces` + `NSMainMenuWindowLevel+1`
//! — insufficient; panel still landed on primary Space / behind fullscreen apps.
//!
//! Native menubar apps (Paste, Raycast, Parallel) use NSStatusItem + a non-activating
//! panel at `NSPopUpMenuWindowLevel` with `CanJoinAllSpaces | Stationary |
//! FullScreenAuxiliary`. Regular `NSWindow` cannot render over fullscreen Spaces unless
//! the app uses `ActivationPolicy::Accessory` (LSUIElement) and the above flags are OR'd
//! into the existing `collectionBehavior` (not overwritten). See tauri#11488, tauri-nspanel.

#[cfg(target_os = "macos")]
use tauri::{ActivationPolicy, AppHandle, WebviewWindow};

/// Menubar apps should not appear in the Dock; required for `CanJoinAllSpaces` over fullscreen.
#[cfg(target_os = "macos")]
pub fn init_menubar_app_policy(app: &AppHandle) {
    let _ = app.set_activation_policy(ActivationPolicy::Accessory);
}

/// Switch to Regular when opening a normal settings window (shows Dock icon while settings open).
#[cfg(target_os = "macos")]
pub fn activate_settings_policy(app: &AppHandle) {
    let _ = app.set_activation_policy(ActivationPolicy::Regular);
}

#[cfg(target_os = "macos")]
pub fn configure_popover_window(window: &WebviewWindow) {
    let _ = window.set_always_on_top(true);
    let _ = window.set_visible_on_all_workspaces(true);

    use cocoa::appkit::NSWindowCollectionBehavior;
    use cocoa::base::id;
    use objc::{msg_send, sel, sel_impl};

    // NSPopUpMenuWindowLevel — same tier as native menu-bar extras / popovers.
    const POPUP_MENU_WINDOW_LEVEL: i64 = 101;
    // NSWindowStyleMaskNonactivatingPanel — panel receives clicks without activating the app.
    const NONACTIVATING_PANEL: usize = 1 << 7;

    let Ok(ns_win) = window.ns_window() else {
        return;
    };

    unsafe {
        let ns_win = ns_win as id;

        let existing: NSWindowCollectionBehavior = msg_send![ns_win, collectionBehavior];
        let behavior = existing
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorIgnoresCycle;
        let _: () = msg_send![ns_win, setCollectionBehavior: behavior];

        let _: () = msg_send![ns_win, setLevel: POPUP_MENU_WINDOW_LEVEL];

        let style_mask: usize = msg_send![ns_win, styleMask];
        if style_mask & NONACTIVATING_PANEL == 0 {
            let _: () = msg_send![ns_win, setStyleMask: style_mask | NONACTIVATING_PANEL];
        }

        let _: () = msg_send![ns_win, setHidesOnDeactivate: false];
        let _: () = msg_send![ns_win, setWorksWhenModal: true];
        // Panel-style floater; works with non-activating style mask on standard NSWindow.
        let _: () = msg_send![ns_win, setFloatingPanel: true];
    }
}

/// Show overlay above fullscreen Spaces without moving it to the primary desktop.
#[cfg(target_os = "macos")]
pub fn show_popover_window(window: &WebviewWindow) {
    use cocoa::base::id;
    use objc::{msg_send, sel, sel_impl};

    configure_popover_window(window);

    let Ok(ns_win) = window.ns_window() else {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    };

    unsafe {
        let ns_win = ns_win as id;
        let _: () = msg_send![ns_win, orderFrontRegardless];
    }
    let _ = window.set_focus();
}

#[cfg(not(target_os = "macos"))]
pub fn init_menubar_app_policy(_app: &tauri::AppHandle) {}

#[cfg(not(target_os = "macos"))]
pub fn activate_settings_policy(_app: &tauri::AppHandle) {}

#[cfg(not(target_os = "macos"))]
pub fn configure_popover_window(window: &tauri::WebviewWindow) {
    let _ = window.set_always_on_top(true);
}

#[cfg(not(target_os = "macos"))]
pub fn show_popover_window(window: &tauri::WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}
