import { KEYCLOAK_CONFIG, KEYCLOAK_INIT_OPTIONS } from './config.js';

export const keycloak = new Keycloak(KEYCLOAK_CONFIG);

export function initAuth() {
    keycloak.init(KEYCLOAK_INIT_OPTIONS).then(authenticated => {
        const loginBtn = document.getElementById('btn-login');
        const logoutBtn = document.getElementById('btn-logout');
        const userGreeting = document.getElementById('user-greeting');
        const usernameSpan = document.getElementById('username');

        if (authenticated) {
            keycloak.loadUserProfile().then(profile => {
                usernameSpan.textContent = profile.username || profile.email || 'User';
            }).catch(() => {
                usernameSpan.textContent = 'User';
            });

            /* role hierarchy, default role -> student */
            const roles = keycloak.realmAccess?.roles || [];
            let userRole = 'user';
            if (roles.includes('admin')) userRole = 'admin';
            else if (roles.includes('teacher')) userRole = 'teacher';
            else if (roles.includes('student')) userRole = 'student';
            document.getElementById('user-role').textContent = userRole;

            loginBtn.style.display = 'none';

            /* show auth-only menu items (To-Do, Statistics, Logout) */
            document.querySelectorAll('.auth-only').forEach(el => {
                el.style.display = 'block';
            });
        }
    });
}
