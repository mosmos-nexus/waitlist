<script lang="ts">
  import type { PageProps } from './$types';
  import Seo from '$lib/components/Seo.svelte';
  import Hero from '$lib/components/sections/Hero.svelte';
  import ConversationCuts from '$lib/components/sections/ConversationCuts.svelte';
  import HowItWorks from '$lib/components/sections/HowItWorks.svelte';
  import MosMonCards from '$lib/components/sections/MosMonCards.svelte';
  import StoryExample from '$lib/components/sections/StoryExample.svelte';
  import SocialProof from '$lib/components/sections/SocialProof.svelte';
  import { m } from '$lib/paraglide/messages.js';

  let { data }: PageProps = $props();
</script>

<Seo title={m.meta_title()} description={m.meta_description()} includeOrganization />

<Hero />
<ConversationCuts />
<HowItWorks />
<MosMonCards />
<StoryExample />
<SocialProof registrantCount={data.registrantCount} />
