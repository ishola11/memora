use std::env;

#[derive(Debug, Clone)]
pub struct SyncConfig {
    pub url: String,
    pub anon_key: String,
}

impl SyncConfig {
    pub fn from_env() -> Option<Self> {
        let url = env::var("SUPABASE_URL").ok()?;
        let anon_key = env::var("SUPABASE_ANON_KEY").ok()?;
        if url.is_empty() || anon_key.is_empty() {
            return None;
        }
        Some(Self { url, anon_key })
    }

    pub fn rest_url(&self) -> String {
        format!("{}/rest/v1", self.url.trim_end_matches('/'))
    }

    pub fn auth_url(&self) -> String {
        format!("{}/auth/v1", self.url.trim_end_matches('/'))
    }

    pub fn realtime_url(&self) -> String {
        let host = self.url.trim_end_matches('/').replace("https://", "wss://");
        format!("{host}/realtime/v1/websocket")
    }
}
