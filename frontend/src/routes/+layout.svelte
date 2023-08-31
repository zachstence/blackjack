<script>
  import Version from '$lib/components/Version.svelte';
  import '../app.css';
</script>

<slot />

<Version class="absolute bottom-2 right-2" />
