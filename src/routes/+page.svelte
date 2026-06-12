<script lang="ts">
	let name = $state('');
	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let message = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		status = 'loading';

		try {
			const response = await fetch('/api/waitlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email })
			});
			const data = (await response.json()) as { message: string };

			status = response.ok ? 'success' : 'error';
			message = data.message;
		} catch {
			status = 'error';
			message = 'Network error. Please try again.';
		}
	}
</script>

<main>
	<h1>Mosmos</h1>
	<p>Join the waitlist.</p>

	<form onsubmit={handleSubmit}>
		<input type="text" placeholder="Name" required bind:value={name} />
		<input type="email" placeholder="Email" required bind:value={email} />
		<button type="submit" disabled={status === 'loading'}>
			{status === 'loading' ? 'Joining…' : 'Join'}
		</button>
	</form>

	{#if message}
		<p role="status">{message}</p>
	{/if}
</main>
