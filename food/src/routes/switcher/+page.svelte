<script lang="ts">
    import { base } from '$app/paths';
    import { sharedUsers, type SharedUser } from '$lib/shared-users';
    import { goto } from '$app/navigation';
    import { getBusinessDate } from '$lib/activity-grouping';
    
    // Subscribe to store
    let users = $state<SharedUser[]>([]);
    sharedUsers.subscribe(u => users = u);

    function goHome() {
        // Hard reset to base
        window.location.href = `${base}/`;
    }

    function visitUser(user: any) {
        // Construct sharing URL
        // We probably want to go to "Today" by default?
        const today = getBusinessDate(new Date());
        goto(`${base}/sharing?folderId=${user.folderId}&date=${today}`);
    }

    function removeUser(e: Event, folderId: string) {
        e.stopPropagation();
        if (confirm('Forget this shared log?')) {
            sharedUsers.removeUser(folderId);
        }
    }
</script>

<div class="page-container">
    <div class="header-bar">
        <h1>Switch User</h1>
    </div>

    <div class="user-list glass-panel">
        <!-- My Log -->
        <button class="user-row my-log" onclick={goHome}>
            <div class="avatar-ph">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div class="info">
                <h3>My Log</h3>
                <span class="sub">Personal</span>
            </div>
            <div class="arrow">&rarr;</div>
        </button>

        <div class="divider"></div>

        <!-- Shared Users -->
        {#if users.length === 0}
            <div class="empty-msg">No shared logs visited yet.</div>
        {:else}
            {#each users as user}
                <div class="user-row" role="button" tabindex="0" onclick={() => visitUser(user)} onkeydown={(e) => e.key === 'Enter' && visitUser(user)}>
                    <div class="avatar-img">
                        {#if user.avatar}
                            <img src={user.avatar} alt={user.name} />
                        {:else}
                            <div class="avatar-fallback">{user.name[0]}</div>
                        {/if}
                    </div>
                    <div class="info">
                        <h3>{user.name}</h3>
                        <span class="sub">Shared Log</span>
                    </div>
                    <button class="remove-btn" onclick={(e) => removeUser(e, user.folderId)} aria-label="Remove">
                        &times;
                    </button>
                    <div class="arrow">&rarr;</div>
                </div>
            {/each}
        {/if}
    </div>
    
    <button class="back-link" onclick={() => history.back()}>Cancel</button>
</div>

<style>
    .page-container {
        padding: 20px;
        max-width: 600px;
        margin: 0 auto;
        min-height: 100vh;
        color: white;
    }

    .header-bar {
        text-align: center;
        margin-bottom: 30px;
    }

    h1 {
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0;
    }

    .glass-panel {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        overflow: hidden;
    }

    .user-row {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background: none;
        border: none;
        text-align: left;
        color: white;
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
    }

    .user-row:hover {
        background: rgba(255,255,255,0.05);
    }
    
    .user-row:not(:last-child) {
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .my-log .avatar-ph {
        background: var(--color-primary, #ff4d4d);
        color: white;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .avatar-img {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        background: #333;
    }
    
    .avatar-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .avatar-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: 600;
        background: #555;
    }

    .info {
        flex: 1;
        margin-left: 16px;
    }

    .info h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .sub {
        font-size: 0.85rem;
        color: rgba(255,255,255,0.5);
    }

    .arrow {
        font-size: 1.5rem;
        color: rgba(255,255,255,0.3);
        margin-left: 10px;
    }

    .remove-btn {
        background: none;
        border: none;
        color: rgba(255,255,255,0.4);
        font-size: 1.5rem;
        padding: 8px;
        cursor: pointer;
        margin-right: 8px;
        z-index: 2; /* above row click */
    }
    
    .remove-btn:hover {
        color: #ff4d4d;
    }

    .divider {
        height: 1px;
        background: rgba(255,255,255,0.1);
        margin: 0 20px;
    }

    .empty-msg {
        padding: 20px;
        text-align: center;
        color: rgba(255,255,255,0.4);
        font-style: italic;
    }
    
    .back-link {
        display: block;
        margin: 30px auto;
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        cursor: pointer;
        font-size: 1rem;
    }
    
    .back-link:hover {
        color: white;
    }
</style>
