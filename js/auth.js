// ===== CONFIGURAÇÃO DE PERSISTÊNCIA DE AUTENTICAÇÃO =====

auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(err => {
    console.warn('Could not set auth persistence:', err);
});

// ===== LÓGICA DE LOGIN COM CONTROLE DE TENTATIVAS =====

const loginForm = document.querySelector('#login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = loginForm['email'].value;
        const password = loginForm['password'].value;
        const messageDiv = document.querySelector('#error-message');

        const now = new Date().getTime();
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const userData = loginAttempts[email] || { attempts: 0, blockUntil: null };

        // 1. VERIFICAR SE A CONTA ESTÁ BLOQUEADA
        if (userData.blockUntil && now < userData.blockUntil) {
            const remainingTime = Math.ceil((userData.blockUntil - now) / (1000 * 60));
            const friendlyMessage = `Muitas tentativas de login. Sua conta está bloqueada. Tente novamente em ${remainingTime} minutos.`;
            
            if (messageDiv) {
                messageDiv.textContent = friendlyMessage;
                messageDiv.classList.remove('d-none', 'alert-success');
                messageDiv.classList.add('alert-danger');
            } else {
                alert(friendlyMessage);
            }
            return; // Impede a tentativa de login
        }

        // Reseta o bloqueio se o tempo já passou
        if (userData.blockUntil && now >= userData.blockUntil) {
            userData.attempts = 0;
            userData.blockUntil = null;
        }

        // Tenta autenticar o usuário com Firebase Auth
        auth.signInWithEmailAndPassword(email, password).then(cred => {
            // SUCESSO NO LOGIN: Limpa as tentativas e redireciona
            delete loginAttempts[email];
            localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));

            if (messageDiv) {
                loginForm.querySelector('button').disabled = true;
                loginForm.querySelector('input[type="email"]').disabled = true;
                loginForm.querySelector('input[type="password"]').disabled = true;

                messageDiv.textContent = 'Acesso Válido! Seja Bem Vindo.';
                messageDiv.classList.remove('d-none', 'alert-danger');
                messageDiv.classList.add('alert-success');

                setTimeout(() => {
                    window.location.replace('index.html');
                }, 2000);
            } else {
                alert('Acesso Válido! Seja Bem Vindo.');
                window.location.replace('index.html');
            }
        }).catch(err => {
            let friendlyMessage = 'Email ou senha incorretos. Tente novamente!';

            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/invalid-email':
                    friendlyMessage = 'E-mail não encontrado. Verifique o e-mail digitado.';
                    break;
                case 'auth/wrong-password':
                    // 2. FALHA NO LOGIN: Incrementa as tentativas e bloqueia se necessário
                    userData.attempts += 1;
                    if (userData.attempts >= 3) {
                        userData.blockUntil = now + 10 * 60 * 1000; // Bloqueia por 10 minutos
                        friendlyMessage = 'Senha incorreta. Você excedeu o número de tentativas. A conta foi bloqueada por 10 minutos.';
                    } else {
                        const remainingAttempts = 3 - userData.attempts;
                        friendlyMessage = `Senha incorreta. Você tem mais ${remainingAttempts} tentativa(s).`;
                    }
                    loginAttempts[email] = userData;
                    localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
                    break;
                case 'auth/too-many-requests':
                    friendlyMessage = 'Acesso bloqueado temporariamente após 3 tentativas invalidas. Tente novamente após 10min.';
                    break;
            }

            if (messageDiv) {
                messageDiv.textContent = friendlyMessage;
                messageDiv.classList.remove('d-none', 'alert-success');
                messageDiv.classList.add('alert-danger');
            } else {
                alert(friendlyMessage);
            }
        });
    });
}

// ===== LÓGICA DE LOGOUT =====

const logoutButton = document.querySelector('#logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User signed out');
            window.location.replace('login.html');
        }).catch(err => {
            console.error('Sign out error:', err);
        });
    });
}

// ===== CONTROLE DE REDIRECIONAMENTO BASEADO EM AUTENTICAÇÃO =====

auth.onAuthStateChanged(user => {
    const path = window.location.pathname.toLowerCase();
    
    if (user) {
        if (path === '/' || path.endsWith('/login.html')) {
            window.location.replace('index.html');
        }
    } else {
        if (!path.endsWith('/login.html')) {
            window.location.replace('login.html');
        }
    }
});
