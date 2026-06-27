//! macOS Quick Paste — NSPanel overlay for fullscreen Spaces (Raycast-style).

#[cfg(target_os = "macos")]
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(target_os = "macos")]
use tauri::{AppHandle, Manager, WebviewWindow};
#[cfg(target_os = "macos")]
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt, PanelLevel, StyleMask, WebviewWindowExt,
};

#[cfg(target_os = "macos")]
static QUICK_PASTE_PANEL_READY: AtomicBool = AtomicBool::new(false);

#[cfg(target_os = "macos")]
tauri_panel! {
    panel!(QuickPastePanel {
        config: {
            can_become_key_window: true,
            can_become_main_window: false,
            is_floating_panel: true,
        }
    })
}

#[cfg(target_os = "macos")]
pub fn setup_quick_paste_panel(app: &AppHandle) -> bool {
    if QUICK_PASTE_PANEL_READY.load(Ordering::Relaxed) {
        return true;
    }

    let Some(window) = app.get_webview_window("quick-paste") else {
        tracing::warn!("quick-paste: window not found — panel setup deferred");
        return false;
    };

    let panel = match window.to_panel::<QuickPastePanel>() {
        Ok(p) => p,
        Err(e) => {
            tracing::error!("quick-paste: to_panel failed: {e}");
            return false;
        }
    };

    panel.set_level(PanelLevel::Floating.value());
    panel.set_style_mask(StyleMask::empty().nonactivating_panel().into());
    panel.set_collection_behavior(
        CollectionBehavior::new()
            .full_screen_auxiliary()
            .can_join_all_spaces()
            .into(),
    );
    panel.set_hides_on_deactivate(false);

    QUICK_PASTE_PANEL_READY.store(true, Ordering::Relaxed);
    tracing::info!("quick-paste: converted to NSPanel (fullscreen overlay)");
    true
}

#[cfg(target_os = "macos")]
pub fn retry_setup_quick_paste_panel(app: &AppHandle) {
    if QUICK_PASTE_PANEL_READY.load(Ordering::Relaxed) {
        return;
    }
    setup_quick_paste_panel(app);
}

#[cfg(target_os = "macos")]
pub fn show_quick_paste_panel(app: &AppHandle) {
    if !QUICK_PASTE_PANEL_READY.load(Ordering::Relaxed) {
        setup_quick_paste_panel(app);
    }
    if let Ok(panel) = app.get_webview_panel("quick-paste") {
        panel.show_and_make_key();
    } else if let Some(window) = app.get_webview_window("quick-paste") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg(target_os = "macos")]
pub fn hide_quick_paste_panel(app: &AppHandle) {
    if let Ok(panel) = app.get_webview_panel("quick-paste") {
        panel.hide();
    } else if let Some(window) = app.get_webview_window("quick-paste") {
        let _ = window.hide();
    }
}

#[cfg(target_os = "macos")]
pub fn show_quick_paste_window(_window: &WebviewWindow, app: &AppHandle) {
    show_quick_paste_panel(app);
}

#[cfg(not(target_os = "macos"))]
pub fn setup_quick_paste_panel(_app: &tauri::AppHandle) -> bool {
    true
}

#[cfg(not(target_os = "macos"))]
pub fn retry_setup_quick_paste_panel(_app: &tauri::AppHandle) {}

#[cfg(not(target_os = "macos"))]
pub fn show_quick_paste_window(window: &tauri::WebviewWindow, _app: &tauri::AppHandle) {
    let _ = window.set_always_on_top(true);
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg(not(target_os = "macos"))]
use tauri::Manager;

#[cfg(not(target_os = "macos"))]
pub fn hide_quick_paste_panel(_app: &tauri::AppHandle) {
    if let Some(window) = _app.get_webview_window("quick-paste") {
        let _ = window.hide();
    }
}
