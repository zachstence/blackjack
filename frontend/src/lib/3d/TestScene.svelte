<script lang="ts">
  import { T } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
</script>

<T.PerspectiveCamera makeDefault position={[5, 5, 5]}>
  <OrbitControls />
</T.PerspectiveCamera>

<T.DirectionalLight position={[3, 10, 10]} />
<T.DirectionalLight position={[-3, 10, -10]} intensity={0.2} />
<T.AmbientLight intensity={0.2} />

<slot />
