<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { m } from '$lib/locale.svelte';
  import { localizeHref } from '$lib/locale.svelte';
</script>

<Seo title="{m.privacy_title()} — Mosmos" description={m.privacy_intro()} />

<section class="section privacy">
  <div class="container narrow">
    <h1 class="t-heading-1">{m.privacy_title()}</h1>
    <p class="t-body-1-reading intro">{m.privacy_intro()}</p>

    <dl>
      <div>
        <dt>{m.privacy_items_label()}</dt>
        <dd>{m.privacy_items()}</dd>
      </div>
      <div>
        <dt>{m.privacy_purpose_label()}</dt>
        <dd>{m.privacy_purpose()}</dd>
      </div>
      <div>
        <dt>{m.privacy_consent_label()}</dt>
        <dd>{m.privacy_consent()}</dd>
      </div>
      <div>
        <dt>{m.privacy_optional_label()}</dt>
        <dd>{m.privacy_optional()}</dd>
      </div>
    </dl>

    <a class="back" href={localizeHref('/')}>{m.privacy_back()}</a>
  </div>
</section>

<style>
  /* Same sky the rest of the site sits in, so a legal page still reads as
     part of the world rather than a bare document. */
  .privacy {
    min-height: calc(100svh - 64px);
    padding-top: calc(var(--section-y-mobile) + 64px);
    background:
      radial-gradient(70% 50% at 50% 0%, rgba(15, 111, 218, 0.12), transparent 70%), var(--app-bg);
  }
  @media (min-width: 1024px) {
    .privacy {
      padding-top: calc(var(--section-y-desktop) + 64px);
    }
  }

  .narrow {
    max-width: var(--width-reading);
  }

  h1 {
    color: var(--label-strong);
  }
  .intro {
    margin: var(--space-16) 0 var(--space-40);
    color: var(--label-alternative);
  }

  dl {
    margin: 0;
    display: grid;
    gap: var(--space-24);
  }
  /* Each pair is its own bordered block — the four items are unrelated, so a
     shared divider between them would imply a sequence. */
  dl > div {
    padding-left: var(--space-16);
    border-left: 1px solid var(--line-normal-normal);
  }
  dt {
    font-size: var(--font-size-subtitle-2);
    font-weight: var(--weight-semibold);
    color: var(--label-normal);
  }
  dd {
    margin: var(--space-6) 0 0;
    font-size: var(--font-size-body-2);
    line-height: var(--line-height-body-reading);
    color: var(--label-assistive);
  }

  .back {
    display: inline-block;
    margin-top: var(--space-40);
    min-height: var(--control-m);
    line-height: var(--control-m);
    color: var(--primary-bright);
    font-size: var(--font-size-label-1);
    font-weight: var(--weight-medium);
  }
  .back:hover {
    color: var(--bright-cyan);
  }
</style>
