import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface SharedUser {
    folderId: string;
    name: string;
    avatar: string;
    lastVisited: number;
}

const STORAGE_KEY = 'food_log_shared_users';

function createSharedUsersStore() {
    // Load initial state from localStorage
    let initial: SharedUser[] = [];
    if (browser) {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                initial = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load shared users', e);
        }
    }

    const { subscribe, update, set } = writable<SharedUser[]>(initial);

    return {
        subscribe,
        addOrUpdateUser: (user: Omit<SharedUser, 'lastVisited'>) => {
            update(users => {
                const now = Date.now();
                const existingIndex = users.findIndex(u => u.folderId === user.folderId);
                let newUsers;

                if (existingIndex >= 0) {
                    newUsers = [...users];
                    newUsers[existingIndex] = { ...user, lastVisited: now };
                } else {
                    newUsers = [...users, { ...user, lastVisited: now }];
                }

                // Sort by last visited desc
                newUsers.sort((a, b) => b.lastVisited - a.lastVisited);

                if (browser) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsers));
                }
                return newUsers;
            });
        },
        removeUser: (folderId: string) => {
            update(users => {
                const newUsers = users.filter(u => u.folderId !== folderId);
                if (browser) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsers));
                }
                return newUsers;
            });
        }
    };
}

export const sharedUsers = createSharedUsersStore();
