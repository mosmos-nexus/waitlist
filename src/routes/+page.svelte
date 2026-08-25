<script lang="ts">
  import type { PageProps } from './$types';
  import Seo from '$lib/components/Seo.svelte';
  import Journey from '$lib/components/journey/Journey.svelte';
  import TryConsole from '$lib/components/sections/TryConsole.svelte';
  import TrustCta from '$lib/components/sections/TrustCta.svelte';
  import BuildCta from '$lib/components/sections/BuildCta.svelte';
  import Confirmation from '$lib/components/Confirmation.svelte';
  import { m } from '$lib/locale.svelte';

  let { data }: PageProps = $props();

  // Page-level signup state: the hero and the re-CTA both feed it, and success
  // swaps the whole marketing flow for the arrival screen.
  let result = $state<{ id: string; emailSent: boolean } | null>(null);
  function onSuccess(r: { id: string; emailSent: boolean }) {
    result = r;
    window.scrollTo({ top: 0 });
  }
</script>

<Seo title={m.meta_title()} description={m.meta_description()} includeOrganization />

{#if result}
  <section class="arrival">
    <div class="container">
      <Confirmation pageId={result.id} emailSent={result.emailSent} />
    </div>
  </section>
{:else}
  <Journey {onSuccess} />
  <TryConsole />
  <TrustCta {onSuccess} registrantCount={data.registrantCount} />
  <BuildCta />
{/if}

<style>
  .arrival {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100svh;
    padding-block: var(--section-y-tablet);
    /* The same sky the hero opens on, so arriving doesn't leave the world */
    background:
      radial-gradient(70% 60% at 50% 22%, rgba(33, 237, 179, 0.12), transparent 68%),
      var(--sky-deep);
  }
  .arrival .container {
    display: flex;
    justify-content: center;
  }
</style>
