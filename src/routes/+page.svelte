<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import { syncHtmlLang } from '$lib/i18n';
  import { onMount } from 'svelte';

  onMount(() => {
    syncHtmlLang();
  });
</script>

<main>
  <h1>{m.page_title()}</h1>
  <p>{m.page_tagline()}</p>
</main>
