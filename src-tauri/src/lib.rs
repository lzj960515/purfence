mod codex;
mod environment;

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Ensure app data dir exists. Frontend sidecar spawn stores SQLite here.
            let data_dir = app.handle().path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            // Register deep link scheme for OAuth callback
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let deep_link = app.deep_link();

                // Register the scheme
                if let Err(e) = deep_link.register_all() {
                    log::error!("Failed to register deep link scheme: {}", e);
                } else {
                    log::info!("Successfully registered deep link scheme: purfence");
                }

                // Listen for deep link events
                let app_handle = app.handle().clone();
                deep_link.on_open_url(move |event| {
                    for url in event.urls() {
                        log::info!("Received deep link: {}", url);

                        // Emit event to frontend
                        if let Err(e) = app_handle.emit("deep-link", url.to_string()) {
                            log::error!("Failed to emit deep-link event: {}", e);
                        }
                    }
                });
            }

            environment::auto_sync_builtin_agents_on_startup(&app.handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            codex::read_codex_token,
            codex::write_codex_token,
            codex::delete_codex_token,
            codex::codex_token_exists,
            environment::desktop_environment_status,
            environment::install_claude_code_desktop,
            environment::install_builtin_agents_desktop,
            environment::desktop_skills_catalog,
            environment::install_desktop_skill,
            environment::git_install_prompt_desktop
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
