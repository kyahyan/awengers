
import { UserProfile } from './UserProfile';

const API_URL = 'http://localhost:3000/api';

export const ApiClient = {
    async getUserProfile(commanderName: string): Promise<UserProfile | null> {
        try {
            const response = await fetch(`${API_URL}/user/${commanderName}`);
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error('Failed to fetch profile');
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    async saveUserProfile(profile: UserProfile): Promise<UserProfile | null> {
        try {
            const response = await fetch(`${API_URL}/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profile)
            });

            if (!response.ok) {
                throw new Error('Failed to save profile');
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
};
