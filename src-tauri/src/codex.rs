use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Codex token data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodexToken {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: u64,
    pub token_type: String,
}

/// Error types for Codex token operations
#[derive(Debug)]
pub enum CodexTokenError {
    FileNotFound,
    InvalidJson(String),
    IoError(String),
    PermissionDenied,
    HomeDirNotFound,
}

impl std::fmt::Display for CodexTokenError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CodexTokenError::FileNotFound => write!(f, "Codex token file not found"),
            CodexTokenError::InvalidJson(msg) => write!(f, "Invalid JSON in token file: {}", msg),
            CodexTokenError::IoError(msg) => write!(f, "IO error: {}", msg),
            CodexTokenError::PermissionDenied => write!(f, "Permission denied"),
            CodexTokenError::HomeDirNotFound => write!(f, "Home directory not found"),
        }
    }
}

impl From<CodexTokenError> for String {
    fn from(error: CodexTokenError) -> Self {
        error.to_string()
    }
}

/// Get the path to ~/.codex/auth.json
fn get_codex_token_path() -> Result<PathBuf, CodexTokenError> {
    let home_dir = dirs::home_dir().ok_or(CodexTokenError::HomeDirNotFound)?;
    Ok(home_dir.join(".codex").join("auth.json"))
}

/// Ensure .codex directory exists with proper permissions
fn ensure_codex_dir() -> Result<(), CodexTokenError> {
    let home_dir = dirs::home_dir().ok_or(CodexTokenError::HomeDirNotFound)?;
    let codex_dir = home_dir.join(".codex");

    if !codex_dir.exists() {
        fs::create_dir_all(&codex_dir).map_err(|e| CodexTokenError::IoError(e.to_string()))?;

        // Set directory permissions to 700 (user only)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&codex_dir)
                .map_err(|e| CodexTokenError::IoError(e.to_string()))?
                .permissions();
            perms.set_mode(0o700);
            fs::set_permissions(&codex_dir, perms)
                .map_err(|e| CodexTokenError::IoError(e.to_string()))?;
        }
    }

    Ok(())
}

/// Read Codex token from ~/.codex/auth.json
#[tauri::command]
pub async fn read_codex_token() -> Result<Option<CodexToken>, String> {
    let token_path = get_codex_token_path().map_err(|e| e.to_string())?;

    if !token_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&token_path).map_err(|e| {
        CodexTokenError::IoError(format!("Failed to read token file: {}", e)).to_string()
    })?;

    let token: CodexToken = serde_json::from_str(&content).map_err(|e| {
        CodexTokenError::InvalidJson(format!("Failed to parse token JSON: {}", e)).to_string()
    })?;

    Ok(Some(token))
}

/// Write Codex token to ~/.codex/auth.json
#[tauri::command]
pub async fn write_codex_token(token: CodexToken) -> Result<(), String> {
    ensure_codex_dir()?;

    let token_path = get_codex_token_path().map_err(|e| e.to_string())?;

    let json = serde_json::to_string_pretty(&token).map_err(|e| {
        CodexTokenError::InvalidJson(format!("Failed to serialize token: {}", e)).to_string()
    })?;

    fs::write(&token_path, json).map_err(|e| {
        CodexTokenError::IoError(format!("Failed to write token file: {}", e)).to_string()
    })?;

    // Set file permissions to 600 (user read/write only)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&token_path)
            .map_err(|e| CodexTokenError::IoError(e.to_string()))?
            .permissions();
        perms.set_mode(0o600);
        fs::set_permissions(&token_path, perms)
            .map_err(|e| CodexTokenError::IoError(e.to_string()))?;
    }

    Ok(())
}

/// Delete Codex token file
#[tauri::command]
pub async fn delete_codex_token() -> Result<(), String> {
    let token_path = get_codex_token_path().map_err(|e| e.to_string())?;

    if !token_path.exists() {
        return Err(CodexTokenError::FileNotFound.to_string());
    }

    fs::remove_file(&token_path)
        .map_err(|e| CodexTokenError::IoError(format!("Failed to delete token file: {}", e)).to_string())?;

    Ok(())
}

/// Check if Codex token file exists
#[tauri::command]
pub async fn codex_token_exists() -> Result<bool, String> {
    let token_path = get_codex_token_path().map_err(|e| e.to_string())?;
    Ok(token_path.exists())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_codex_token_serialization() {
        let token = CodexToken {
            access_token: "test_access_token".to_string(),
            refresh_token: "test_refresh_token".to_string(),
            expires_at: 1234567890,
            token_type: "Bearer".to_string(),
        };

        let json = serde_json::to_string(&token).unwrap();
        assert!(json.contains("access_token"));
        assert!(json.contains("refresh_token"));
    }

    #[test]
    fn test_codex_token_deserialization() {
        let json = r#"{
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token",
            "expires_at": 1234567890,
            "token_type": "Bearer"
        }"#;

        let token: CodexToken = serde_json::from_str(json).unwrap();
        assert_eq!(token.access_token, "test_access_token");
        assert_eq!(token.refresh_token, "test_refresh_token");
        assert_eq!(token.expires_at, 1234567890);
        assert_eq!(token.token_type, "Bearer");
    }
}
