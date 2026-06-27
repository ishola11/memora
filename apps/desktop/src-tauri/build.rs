fn embed_env(name: &str) {
    if let Ok(value) = std::env::var(name) {
        if value.is_empty() {
            return;
        }
        println!("cargo:rustc-env={name}={value}");
    }
}

fn main() {
    let manifest_dir = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let desktop_env = manifest_dir.join("..").join(".env");
    if desktop_env.exists() {
        println!("cargo:rerun-if-changed={}", desktop_env.display());
        dotenvy::from_path(&desktop_env).ok();
    }

    embed_env("SUPABASE_URL");
    embed_env("SUPABASE_ANON_KEY");

    let pubkey_path = manifest_dir.join("keys").join("memora.key.pub");

    if pubkey_path.exists() {
        println!("cargo:rerun-if-changed={}", pubkey_path.display());
        if let Ok(pubkey) = std::fs::read_to_string(&pubkey_path) {
            let pubkey = pubkey.trim();
            if !pubkey.is_empty() {
                let config = serde_json::json!({
                    "plugins": {
                        "updater": {
                            "pubkey": pubkey
                        }
                    }
                });
                std::env::set_var("TAURI_CONFIG", config.to_string());
            }
        }
    }

    tauri_build::build()
}
