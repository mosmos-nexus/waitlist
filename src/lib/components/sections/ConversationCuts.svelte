<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
</script>

<section class="section conv">
  <div class="container">
    <span class="eyebrow">{m.conv_eyebrow()}</span>
    <p class="intro">{m.conv_intro()}</p>

    <div class="thread">
      <div class="bubble user">
        <p>{m.conv_user()}</p>
      </div>

      <div class="bubble mos">
        <img class="avatar" src="/characters/mos-working.webp" alt="" width={48} height={48} />
        <p>{m.conv_mos_1()}</p>
      </div>
      <!-- First-use gloss for the world term "Mon" (cold-visitor clarity). -->
      <p class="gloss">{m.conv_mon_gloss()}</p>

      <!-- §5-2 note: show the delivered result so cut 3 reads as "what the user receives". -->
      <div class="result" role="img" aria-label={m.conv_result_tag()}>
        <span class="result-tag" aria-hidden="true">{m.conv_result_tag()}</span>
        <span class="bar w70"></span>
        <span class="bar w90"></span>
        <span class="bar w50"></span>
      </div>

      <div class="bubble mos">
        <img class="avatar" src="/characters/mos-happy.webp" alt="" width={48} height={48} />
        <p>{m.conv_mos_2()}</p>
      </div>
    </div>

    <p class="close">{m.conv_close()}</p>
  </div>
</section>

<style>
  .conv .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .eyebrow {
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    letter-spacing: var(--tracking-wide);
    text-transform: none;
    color: var(--color-accent);
  }
  .intro {
    margin: var(--space-sm) 0 var(--space-2xl);
    max-width: 18em;
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-h2);
    line-height: var(--lh-h2);
    color: var(--text-strong);
  }
  .thread {
    display: flex;
    flex-direction: column;
    gap: var(--space-base);
    width: 100%;
    max-width: 460px;
  }
  .bubble {
    display: flex;
    align-items: flex-end;
    gap: var(--space-sm);
    max-width: 88%;
  }
  .bubble p {
    margin: 0;
    padding: 12px 16px;
    font-size: var(--fs-body);
    line-height: 1.5;
    border-radius: var(--radius-lg);
  }
  .bubble.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
  .bubble.user p {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-bottom-right-radius: var(--radius-sm);
  }
  .bubble.mos {
    align-self: flex-start;
  }
  .bubble.mos p {
    background: var(--surface-card);
    color: var(--text-body);
    border: 1px solid var(--border-subtle);
    border-bottom-left-radius: var(--radius-sm);
    box-shadow: var(--shadow-e1);
  }
  .avatar {
    flex: none;
    border-radius: var(--radius-pill);
    background: var(--surface-subtle);
  }
  .gloss {
    align-self: flex-start;
    margin: -6px 0 0 56px;
    max-width: 80%;
    font-size: var(--fs-caption);
    line-height: var(--lh-caption);
    color: var(--text-muted);
    text-align: left;
  }
  .result {
    align-self: flex-start;
    margin-left: 56px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    width: 180px;
    padding: 14px;
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-e1);
  }
  .result-tag {
    font-size: var(--fs-caption);
    font-weight: var(--fw-semibold);
    color: var(--text-muted);
    text-align: left;
  }
  .result-tag + .bar {
    margin-top: 2px;
  }
  .bar {
    height: 8px;
    border-radius: var(--radius-pill);
    background: var(--surface-sunken);
  }
  .bar.w90 {
    width: 90%;
  }
  .bar.w70 {
    width: 70%;
  }
  .bar.w50 {
    width: 50%;
  }
  .close {
    margin: var(--space-2xl) 0 0;
    font-family: var(--font-display);
    font-weight: var(--fw-bold);
    font-size: var(--fs-h3);
    color: var(--text-strong);
  }
</style>
