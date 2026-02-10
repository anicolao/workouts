<script lang="ts">
    import { store } from '$lib/store';
    import { sharedUsers } from '$lib/shared-users';
    import { userProfile } from '$lib/auth';
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let isReadOnly = $state(false);
    let currentFolderId = $state<string | null>(null);
    let sharedUsersList = $state<any[]>([]);
    let personalProfile = $state<any>(null);

    onMount(() => {
        const update = () => {
            const state = store.getState();
            isReadOnly = state.config.isReadOnly;
            currentFolderId = state.config.folderId;
        };
        update();

        const unsubStore = store.subscribe(update);
        const unsubShared = sharedUsers.subscribe(u => sharedUsersList = u);
        const unsubProfile = userProfile.subscribe(p => personalProfile = p);

        return () => {
            unsubStore();
            unsubShared();
            unsubProfile();
        };
    });

    let sharedUser = $derived(sharedUsersList.find(u => u.folderId === currentFolderId));
    
    let displayUser = $derived.by(() => {
        if (isReadOnly) {
            return sharedUser ? { 
                name: sharedUser.name, 
                avatar: sharedUser.avatar, 
                type: 'Shared Log' 
            } : null;
        } else {
            return personalProfile ? { 
                name: personalProfile.name || 'User', 
                avatar: personalProfile.picture, 
                type: 'Personal Log' 
            } : null;
        }
    });

    function handleClick() {
        goto(`${base}/switcher`);
    }

</script>

{#if displayUser}
<div class="desktop-header">
    <button class="user-chip glass-panel" onclick={handleClick} aria-label="Switch User">
        <div class="avatar-circle">
            {#if displayUser.avatar}
                <img src={displayUser.avatar} alt={displayUser.name} />
            {:else}
                <span class="initial">{displayUser.name[0]}</span>
            {/if}
        </div>
        <div class="info">
            <span class="name">{displayUser.name}</span>
            <span class="type">{displayUser.type}</span>
        </div>
        <div class="arrow">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
    </button>
</div>
{/if}

<style>
    .desktop-header {
        display: none; /* Mobile hidden */
    }

    @media (min-width: 1024px) {
        .desktop-header {
            display: flex;
            justify-content: flex-end; /* Align to right */
            align-items: center;
            height: 80px; /* Gutter height */
            padding: 0 40px;
            width: 100%;
        }

        .user-chip {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 8px 16px 8px 8px;
            border-radius: 50px;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
            color: white;
            gap: 12px;
            outline: none;
        }

        .user-chip:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .user-chip:active {
            transform: scale(0.98);
        }

        .avatar-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
            background: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.2rem;
        }

        .avatar-circle img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            line-height: 1.2;
        }

        .name {
            font-weight: 600;
            font-size: 0.9rem;
        }

        .type {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .arrow {
            opacity: 0.5;
            margin-left: 4px;
        }
    }
</style>
