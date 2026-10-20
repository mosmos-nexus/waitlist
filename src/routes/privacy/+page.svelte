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
        <dt>{m.privacy_optional_label()}</dt>
        <dd>{m.privacy_optional()}</dd>
      </div>
      <div>
        <dt>{m.privacy_retention_label()}</dt>
        <dd>{m.privacy_retention()}</dd>
      </div>
      <div>
        <dt>{m.privacy_processors_label()}</dt>
        <dd>{m.privacy_processors()}</dd>
      </div>
      <div>
        <dt>{m.privacy_consent_label()}</dt>
        <dd>{m.privacy_consent()}</dd>
      </div>
      <div>
        <dt>{m.privacy_contact_label()}</dt>
        <dd>
          {m.privacy_contact()}<br />
          <a href="mailto:hello@mosmos.world">hello@mosmos.world</a>
        </dd>
      </div>
    </dl>

    <p class="version">{m.privacy_version()}</p>

    <a class="back" href={localizeHref('/')}>{m.privacy_back()}</a>
  </div>
</section>

<style>
  /* Same sky wash as the home page, so a legal page still reads as part of
     the site rather than a bare document. */
  .privacy {
    min-height: calc(100svh - var(--header-height));
    background: var(--gradient-sky);
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
  /* Each pair is its own bordered block — the items are unrelated, so a
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

  .version {
    margin-top: var(--space-32);
    font-size: var(--font-size-caption-1);
    color: var(--label-assistive);
  }

  .back {
    display: inline-block;
    margin-top: var(--space-24);
    min-height: var(--control-m);
    line-height: var(--control-m);
    color: var(--primary-normal);
    font-size: var(--font-size-label-1);
    font-weight: var(--weight-medium);
  }
  .back:hover {
    color: var(--primary-strong);
  }
</style>
