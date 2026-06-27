use sha2::{Digest, Sha256};

#[derive(Debug, Clone)]
pub enum CapturedContent {
    Text(String),
    Url(String),
    Code(String),
    Image {
        path: String,
        size: i64,
        thumbnail_path: Option<String>,
    },
}

pub fn classify(text: &str) -> (&'static str, CapturedContent) {
    let trimmed = text.trim();
    if crate::search::is_url(trimmed) {
        return ("url", CapturedContent::Url(trimmed.to_string()));
    }
    if crate::search::looks_like_code(trimmed) {
        return ("code", CapturedContent::Code(trimmed.to_string()));
    }
    ("text", CapturedContent::Text(trimmed.to_string()))
}

pub fn hash_content(content_type: &str, text: Option<&str>, blob_path: Option<&str>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content_type.as_bytes());
    if let Some(t) = text {
        hasher.update(t.as_bytes());
    }
    if let Some(p) = blob_path {
        hasher.update(p.as_bytes());
    }
    hex::encode(hasher.finalize())
}
