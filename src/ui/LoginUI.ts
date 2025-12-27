
export class LoginUI {
    private container: HTMLElement;
    private onLoginSuccess: (userData: any) => void;

    constructor(onLoginSuccess: (userData: any) => void) {
        this.onLoginSuccess = onLoginSuccess;
        this.container = document.createElement('div');
        this.container.className = 'login-container';
        this.render();
    }

    private isRegisterMode = false;

    private render() {
        this.container.innerHTML = `
            <div class="login-box">
                <h1>Awengers</h1>
                <input type="text" id="login-username" placeholder="Username" />
                <input type="text" id="login-commandername" placeholder="Commander Name (Display)" style="display:none;" />
                <input type="password" id="login-password" placeholder="Password" />
                
                <button id="btn-action">LOGIN</button>
                
                <div class="toggle-link" id="btn-toggle-mode">New Commander? Create Account</div>
                
                <div id="login-msg" class="error-msg"></div>
            </div>
            <style>
                .login-container {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 9999;
                    pointer-events: auto;
                    font-family: 'SF Pro Display', sans-serif;
                }
                .login-box {
                    background: #222;
                    padding: 40px;
                    border-radius: 20px;
                    display: flex; flex-direction: column; gap: 15px;
                    border: 1px solid #444;
                    color: white;
                    width: 350px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }
                .login-box h1 {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #ffd700;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .login-box input {
                    padding: 12px;
                    font-size: 1rem;
                    background: #333;
                    border: 1px solid #555;
                    color: white;
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .login-box input:focus {
                    border-color: #ffd700;
                }
                .login-box button {
                    padding: 12px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
                    border: none;
                    color: white;
                    font-weight: bold;
                    border-radius: 8px;
                    margin-top: 10px;
                    transition: transform 0.1s, filter 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .login-box button:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                }
                .login-box button:active {
                    transform: translateY(1px);
                }
                .toggle-link {
                    text-align: center;
                    color: #aaa;
                    font-size: 0.9rem;
                    cursor: pointer;
                    margin-top: 10px;
                    text-decoration: underline;
                }
                .toggle-link:hover {
                    color: #fff;
                }
                .error-msg {
                    color: #ff6b6b;
                    text-align: center;
                    min-height: 1.5rem;
                    font-size: 0.9rem;
                }
            </style>
        `;

        this.container.querySelector('#btn-action')?.addEventListener('click', () => this.handleAction());
        this.container.querySelector('#btn-toggle-mode')?.addEventListener('click', () => this.toggleMode());

        this.setupInputListeners();
    }

    private setupInputListeners() {
        // Fix: Stop key events from bubbling to game controls
        const inputs = this.container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => e.stopPropagation());
            input.addEventListener('keyup', (e) => e.stopPropagation());
            input.addEventListener('keypress', (e) => e.stopPropagation());

            // Allow submitting with Enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleAction();
                }
            });
        });
    }

    private toggleMode() {
        this.isRegisterMode = !this.isRegisterMode;

        const commanderInput = this.container.querySelector('#login-commandername') as HTMLElement;
        const actionBtn = this.container.querySelector('#btn-action') as HTMLElement;
        const toggleLink = this.container.querySelector('#btn-toggle-mode') as HTMLElement;
        const msg = this.container.querySelector('#login-msg') as HTMLElement;

        msg.innerText = ""; // Clear errors

        if (this.isRegisterMode) {
            commanderInput.style.display = 'block';
            actionBtn.innerText = "REGISTER";
            actionBtn.style.background = "linear-gradient(135deg, #3498db 0%, #2980b9 100%)";
            toggleLink.innerText = "Already have an account? Login";
        } else {
            commanderInput.style.display = 'none';
            actionBtn.innerText = "LOGIN";
            actionBtn.style.background = "linear-gradient(135deg, #f39c12 0%, #d35400 100%)";
            toggleLink.innerText = "New Commander? Create Account";
        }
    }

    private handleAction() {
        if (this.isRegisterMode) {
            this.handleRegister();
        } else {
            this.handleLogin();
        }
    }

    private async handleRegister() {
        const username = (this.container.querySelector('#login-username') as HTMLInputElement).value;
        const commanderName = (this.container.querySelector('#login-commandername') as HTMLInputElement).value;
        const password = (this.container.querySelector('#login-password') as HTMLInputElement).value;
        const msg = this.container.querySelector('#login-msg') as HTMLElement;

        if (!username || !password || !commanderName) {
            msg.innerText = "All fields required for Register";
            return;
        }

        try {
            msg.innerText = "Registering...";
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, commanderName, password })
            });
            const data = await response.json();

            if (response.ok) {
                msg.innerText = "Success! Logging in...";
                // Auto login logic could go here or we switch mode
                // For now, let's just proceed to login automatically
                await this.performLogin(username, password);
            } else {
                msg.innerText = data.message || "Registration failed.";
            }
        } catch (e) {
            msg.innerText = "Connection Error";
        }
    }

    private async handleLogin() {
        const username = (this.container.querySelector('#login-username') as HTMLInputElement).value;
        const password = (this.container.querySelector('#login-password') as HTMLInputElement).value;
        const msg = this.container.querySelector('#login-msg') as HTMLElement;

        if (!username || !password) {
            msg.innerText = "Enter Username & Password";
            return;
        }

        await this.performLogin(username, password);
    }

    private async performLogin(username: string, password: string) {
        const msg = this.container.querySelector('#login-msg') as HTMLElement;
        try {
            msg.innerText = "Logging in...";
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                // Success
                const user = data.user;
                if (user._id && !user.uid) user.uid = user._id; // Map Mongo ID to UID

                localStorage.setItem('awengers_session', JSON.stringify(user));
                this.destroy(); // Remove Login UI
                this.onLoginSuccess(user);
            } else {
                msg.innerText = data.message || "Login failed.";
            }
        } catch (e) {
            msg.innerText = "Connection Error";
        }
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public destroy() {
        this.container.remove();
    }
}
