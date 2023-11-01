<script lang="ts">
  import { T } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
  import { Environment } from '@threlte/extras';
</script>

<Environment isBackground files="/static/3d/casino.jpg" />

<T.PerspectiveCamera makeDefault position={[80, 80, 80]}>
  <OrbitControls />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.2} />

<slot />
