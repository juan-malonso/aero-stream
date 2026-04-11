use wasm_bindgen::prelude::*;
use crypto_box::{SalsaBox as CryptoBox, PublicKey, SecretKey};
use xsalsa20poly1305::{XSalsa20Poly1305, KeyInit, aead::{Aead, AeadCore, OsRng}};
use serde::{Deserialize, Serialize};
use js_sys::JSON;

#[derive(Serialize, Deserialize)]
struct WirePayload {
    data: Vec<u8>,
    nonce: Vec<u8>,
}

#[derive(Serialize)]
#[allow(non_snake_case)] 
struct HandshakeRequest {
    pilotKey: Vec<u8>,
}

#[derive(Deserialize)]
#[allow(non_snake_case)]
struct HandshakeResponse {
    towerKey: Vec<u8>,
    sessionId: String,
}

#[wasm_bindgen]
pub struct SecurePipeCore {
    pilot_secret: SecretKey,
    pilot_public: PublicKey,
    shared_secret: xsalsa20poly1305::Key, 
    tower_public: Option<PublicKey>,
    is_connected: bool,
}

#[wasm_bindgen]
impl SecurePipeCore {
    #[wasm_bindgen(constructor)]
    pub fn new(secret: &str) -> SecurePipeCore {
        let pilot_secret = SecretKey::generate(&mut OsRng);
        let pilot_public = pilot_secret.public_key();
        
        let mut key_bytes = [0u8; 32];
        let secret_bytes = secret.as_bytes();
        let len = secret_bytes.len().min(32);
        key_bytes[..len].copy_from_slice(&secret_bytes[..len]);

        SecurePipeCore {
            pilot_secret,
            pilot_public,
            shared_secret: xsalsa20poly1305::Key::from_slice(&key_bytes).clone(),
            tower_public: None,
            is_connected: false,
        }
    }

    #[wasm_bindgen]
    pub fn is_connected(&self) -> bool {
        self.is_connected
    }

    #[wasm_bindgen]
    pub fn generate_handshake_request(&self) -> Result<String, JsValue> {
        let request = HandshakeRequest {
            pilotKey: self.pilot_public.as_bytes().to_vec(),
        };
        
        let msg_bytes = serde_json::to_vec(&request)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let cipher = XSalsa20Poly1305::new(&self.shared_secret);
        let nonce = XSalsa20Poly1305::generate_nonce(&mut OsRng);

        match cipher.encrypt(&nonce, msg_bytes.as_slice()) {
            Ok(encrypted) => {
                let payload = WirePayload { data: encrypted, nonce: nonce.to_vec() };
                serde_json::to_string(&payload).map_err(|e| JsValue::from_str(&e.to_string()))
            },
            Err(_) => Err(JsValue::from_str("Symmetric encryption failed")),
        }
    }

    #[wasm_bindgen]
    pub fn process_incoming_message(&mut self, raw_msg: &str) -> Result<JsValue, JsValue> {
        let payload: WirePayload = serde_json::from_str(raw_msg)
            .map_err(|e| JsValue::from_str(&format!("Invalid wire payload: {}", e)))?;

        if !self.is_connected {
            let cipher = XSalsa20Poly1305::new(&self.shared_secret);
            let nonce = xsalsa20poly1305::Nonce::from_slice(&payload.nonce);
            
            let decrypted = cipher.decrypt(nonce, payload.data.as_slice())
                .map_err(|_| JsValue::from_str("Handshake decryption failed. Invalid secret key."))?;

            let response: HandshakeResponse = serde_json::from_slice(&decrypted)
                .map_err(|_| JsValue::from_str("Invalid handshake response format"))?;
            
            let mut tk_bytes = [0u8; 32];
            tk_bytes.copy_from_slice(&response.towerKey);
            self.tower_public = Some(PublicKey::from(tk_bytes));
            self.is_connected = true;

            let result_json = format!(r#"{{"sessionId": "{}"}}"#, response.sessionId);
            return JSON::parse(&result_json);

        } else {
            let tower_pub = self.tower_public.as_ref().unwrap();
            let box_cipher = CryptoBox::new(tower_pub, &self.pilot_secret);
            let nonce = crypto_box::Nonce::from_slice(&payload.nonce);

            let decrypted = box_cipher.decrypt(nonce, payload.data.as_slice())
                .map_err(|_| JsValue::from_str("Message decryption failed"))?;

            let json_str = String::from_utf8(decrypted)
                .map_err(|_| JsValue::from_str("Invalid UTF-8 in payload"))?;

            JSON::parse(&json_str)
        }
    }

    #[wasm_bindgen]
    pub fn encrypt_outgoing_message(&self, json_data: &str) -> Result<String, JsValue> {
        if !self.is_connected {
            return Err(JsValue::from_str("Cannot send message, handshake not completed."));
        }
        
        let tower_pub = self.tower_public.as_ref().unwrap();
        let box_cipher = CryptoBox::new(tower_pub, &self.pilot_secret);
        let nonce = CryptoBox::generate_nonce(&mut OsRng);
        
        match box_cipher.encrypt(&nonce, json_data.as_bytes()) {
            Ok(encrypted) => {
                let payload = WirePayload { data: encrypted, nonce: nonce.to_vec() };
                serde_json::to_string(&payload).map_err(|e| JsValue::from_str(&e.to_string()))
            },
            Err(_) => Err(JsValue::from_str("Encryption failed")),
        }
    }
}