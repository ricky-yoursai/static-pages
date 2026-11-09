// auth.js
const AUTH_KEY = "yoursai_global_auth_token";
const VALID_TOKEN = "yoursai_authenticated";

// 登录凭据：只存哈希，源码里看不到明文密码
const VALID_USERNAME = "yoursai";
const VALID_PASSWORD_HASH = "81767608c80c2a532a3d018a6c7f7940bd0ad2c715cc0d9db7bcff2f3495658c"; // SHA-256(password)

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function checkAuth() {
  return sessionStorage.getItem(AUTH_KEY) === VALID_TOKEN;
}

function renderLoginOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "global-login-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #f8fafc;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); width: 100%; max-width: 400px;">
      <h2 style="margin: 0 0 24px; text-align: center; color: #0f172a;">Login</h2>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #475569;">Username</label>
        <input id="auth-username" type="text" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 16px;">
      </div>
      <div style="margin-bottom: 24px;">
        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #475569;">Password</label>
        <input id="auth-password" type="password" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 16px;">
      </div>
      <button id="auth-submit" style="width: 100%; padding: 10px; background: #0ea5e9; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer;">Sign In</button>
      <div id="auth-error" style="color: #ef4444; margin-top: 16px; text-align: center; font-size: 14px; display: none;">Invalid credentials</div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden"; // Prevent scrolling behind overlay

  const submitBtn = document.getElementById("auth-submit");
  const usernameInput = document.getElementById("auth-username");
  const passwordInput = document.getElementById("auth-password");
  const errorMsg = document.getElementById("auth-error");

  async function attemptLogin() {
    const hash = await sha256Hex(passwordInput.value);
    if (usernameInput.value === VALID_USERNAME && hash === VALID_PASSWORD_HASH) {
      sessionStorage.setItem(AUTH_KEY, VALID_TOKEN);
      overlay.remove();
      document.body.style.overflow = "";
      window.dispatchEvent(new Event('auth-success'));
    } else {
      errorMsg.style.display = "block";
    }
  }

  submitBtn.addEventListener("click", attemptLogin);
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptLogin();
  });
}

export function requireAuth() {
  if (!checkAuth()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", renderLoginOverlay);
    } else {
      renderLoginOverlay();
    }
    return false; // not logged in yet
  }
  return true; // already logged in
}
