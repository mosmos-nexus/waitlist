<script lang="ts">
  import WaitlistForm from '$lib/components/WaitlistForm.svelte';
  import { m } from '$lib/locale.svelte';

  interface Props {
    onSuccess: (result: { id: string; emailSent: boolean }) => void;
  }
  let { onSuccess }: Props = $props();
</script>

<section class="section final" aria-labelledby="final-title">
  <div class="container">
    <div class="band">
      <img src="/characters/mos-happy.webp" alt="" width="120" height="113" loading="lazy" />
      <h2 class="title" id="final-title">{m.final_title()}</h2>
      <div class="form">
        <WaitlistForm {onSuccess} position="final" />
      </div>
    </div>
  </div>
</section>

<style>
  .final {
    padding-top: 0;
  }

  /* The brand's CTA ground: sky gradient with a soft Core Blue glow. */
  .band {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 960px;
    margin-inline: auto;
    padding: var(--space-48) var(--space-20);
    border: 1px solid var(--line-normal-alternative);
    border-radius: var(--radius-l);
    background:
      radial-gradient(60% 70% at 50% 0%, rgba(15, 111, 218, 0.12), transparent 70%),
      var(--gradient-sky);
    text-align: center;
  }
  @media (min-width: 768px) {
    .band {
      padding: var(--space-72) var(--space-56);
    }
  }

  img {
    width: 120px;
    height: auto;
  }
  .title {
    margin-top: var(--space-16);
  }

  .form {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: var(--space-32);
    text-align: left;
  }
</style>
