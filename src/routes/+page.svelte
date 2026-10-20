<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Hero from '$lib/components/sections/Hero.svelte';
  import Empathy from '$lib/components/sections/Empathy.svelte';
  import Moments from '$lib/components/sections/Moments.svelte';
  import Waitlist from '$lib/components/sections/Waitlist.svelte';
  import Faq from '$lib/components/sections/Faq.svelte';
  import FinalCta from '$lib/components/sections/FinalCta.svelte';
  import Confirmation from '$lib/components/Confirmation.svelte';
  import { m } from '$lib/locale.svelte';

  // Page-level signup state: every form feeds it, and success swaps the whole
  // marketing flow for the arrival screen.
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
  <Hero {onSuccess} />
  <Empathy />
  <Moments />
  <Waitlist {onSuccess} />
  <Faq />
  <FinalCta {onSuccess} />
{/if}

<style>
  .arrival {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100svh - var(--header-height));
    padding-block: var(--section-y-mobile);
    background: radial-gradient(110% 80% at 50% 0%, rgba(15, 111, 218, 0.1), transparent 66%);
  }
  .arrival .container {
    display: flex;
    justify-content: center;
  }
</style>
