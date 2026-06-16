<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { localizeHref } from '$lib/paraglide/runtime';
</script>

<Seo title="{m.privacy_title()} — Mosmos" description={m.privacy_intro()} />

<section class="section">
  <div class="container narrow">
    <h1>{m.privacy_title()}</h1>
    <p class="intro">{m.privacy_intro()}</p>

    <dl>
      <dt>{m.privacy_items_label()}</dt>
      <dd>{m.privacy_items()}</dd>
      <dt>{m.privacy_purpose_label()}</dt>
      <dd>{m.privacy_purpose()}</dd>
      <dt>{m.privacy_consent_label()}</dt>
      <dd>{m.privacy_consent()}</dd>
      <dt>{m.privacy_optional_label()}</dt>
      <dd>{m.privacy_optional()}</dd>
    </dl>

    <a class="back" href={localizeHref('/')}>{m.privacy_back()}</a>
  </div>
</section>

<style>
  .narrow {
    max-width: var(--width-reading);
  }
  h1 {
    font-size: var(--fs-h1);
    line-height: var(--lh-h1);
    margin-bottom: var(--space-base);
  }
  .intro {
    margin: 0 0 var(--space-2xl);
    color: var(--text-muted);
    line-height: var(--lh-body);
  }
  dl {
    margin: 0;
    display: grid;
    gap: var(--space-lg);
  }
  dt {
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-h3);
    color: var(--text-strong);
    margin-bottom: var(--space-xs);
  }
  dd {
    margin: 0;
    color: var(--text-body);
    line-height: var(--lh-body);
  }
  .back {
    display: inline-block;
    margin-top: var(--space-2xl);
    color: var(--text-link);
    font-weight: var(--fw-medium);
  }
</style>
