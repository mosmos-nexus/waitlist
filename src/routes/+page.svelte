<script lang="ts">
  import type { PageProps } from './$types';
  import Seo from '$lib/components/Seo.svelte';
  import Hero from '$lib/components/sections/Hero.svelte';
  import EmpathyCut from '$lib/components/sections/EmpathyCut.svelte';
  import InteractiveDemo from '$lib/components/sections/InteractiveDemo.svelte';
  import MosTeaser from '$lib/components/sections/MosTeaser.svelte';
  import GrowthLoop from '$lib/components/sections/GrowthLoop.svelte';
  import TrustCta from '$lib/components/sections/TrustCta.svelte';
  import BuildCta from '$lib/components/sections/BuildCta.svelte';
  import Confirmation from '$lib/components/Confirmation.svelte';
  import { m } from '$lib/paraglide/messages.js';

  let { data }: PageProps = $props();

  // Page-level signup state: both the hero (§1) and the re-CTA (§6) feed it, and
  // success swaps the whole marketing flow for the confirmation screen (§7).
  let result = $state<{ id: string; emailSent: boolean } | null>(null);
  function onSuccess(r: { id: string; emailSent: boolean }) {
    result = r;
    window.scrollTo({ top: 0 });
  }
</script>

<Seo title={m.meta_title()} description={m.meta_description()} includeOrganization />

{#if result}
  <section class="confirm-screen">
    <div class="container">
      <Confirmation pageId={result.id} emailSent={result.emailSent} />
    </div>
  </section>
{:else}
  <Hero {onSuccess} />
  <EmpathyCut />
  <InteractiveDemo />
  <MosTeaser />
  <GrowthLoop />
  <TrustCta {onSuccess} registrantCount={data.registrantCount} />
  <BuildCta />
{/if}

<style>
  .confirm-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100svh - 64px);
    padding-block: var(--section-y-tablet);
    background: var(--gradient-sky);
  }
  .confirm-screen .container {
    display: flex;
    justify-content: center;
  }
</style>
