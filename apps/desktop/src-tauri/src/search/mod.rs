use regex::Regex;

#[derive(Debug, Default)]
pub struct ParsedQuery {
    pub text: Option<String>,
    pub device: Option<String>,
    pub content_type: Option<String>,
    pub tag: Option<String>,
    pub is_pinned: bool,
    pub is_favorite: bool,
    pub is_snippet: bool,
    pub date_today: bool,
}

pub fn parse_query(input: &str) -> ParsedQuery {
    let mut parsed = ParsedQuery::default();
    let mut free_text = Vec::new();

    for token in input.split_whitespace() {
        if let Some(val) = token.strip_prefix("device:") {
            parsed.device = Some(normalize_device(val));
        } else if let Some(val) = token.strip_prefix("type:") {
            parsed.content_type = Some(val.to_string());
        } else if let Some(val) = token.strip_prefix("tag:") {
            parsed.tag = Some(val.to_string());
        } else if token == "is:pinned" {
            parsed.is_pinned = true;
        } else if token == "is:favorite" || token == "is:favourited" {
            parsed.is_favorite = true;
        } else if token == "is:snippet" {
            parsed.is_snippet = true;
        } else if token == "today" {
            parsed.date_today = true;
        } else {
            free_text.push(token);
        }
    }

    if !free_text.is_empty() {
        parsed.text = Some(free_text.join(" "));
    }

    parsed
}

fn normalize_device(val: &str) -> String {
    if val.eq_ignore_ascii_case("mac") || val.eq_ignore_ascii_case("macos") {
        "macos".to_string()
    } else if val.eq_ignore_ascii_case("win") || val.eq_ignore_ascii_case("windows") {
        "windows".to_string()
    } else {
        val.to_string()
    }
}

pub fn is_url(text: &str) -> bool {
    let re = Regex::new(r"^https?://[^\s]+$").unwrap();
    re.is_match(text.trim())
}

pub fn looks_like_code(text: &str) -> bool {
    let indicators = [
        "fn ", "function ", "def ", "class ", "import ", "const ", "let ",
        "public ", "private ", "#include", "<?php", "SELECT ", "INSERT ",
    ];
    let first_lines: String = text.lines().take(3).collect::<Vec<_>>().join("\n");
    indicators.iter().any(|i| first_lines.contains(i))
}
